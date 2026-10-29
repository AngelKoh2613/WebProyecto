import { createServiceReportSchema } from "@field-service/validation";
import type { FieldServiceDatabase, LocalReport, LocalSyncStatus } from "./db";

export class LocalStorageError extends Error {
  constructor(message = "No se pudo usar el almacenamiento del dispositivo.") {
    super(message);
    this.name = "LocalStorageError";
  }
}

export class DraftOnlyError extends Error {
  constructor() {
    super("Solo se puede modificar un borrador que todavía no se envía.");
    this.name = "DraftOnlyError";
  }
}

export interface NewLocalReport {
  description: string;
  technicianLabel?: string | null;
  createdAt?: string;
  clientId?: string;
}

export async function createLocalReport(
  db: FieldServiceDatabase,
  input: NewLocalReport,
  syncStatus: Extract<LocalSyncStatus, "draft" | "pending">,
): Promise<LocalReport> {
  const now = new Date().toISOString();
  const parsed = createServiceReportSchema.safeParse({
    clientId: input.clientId ?? crypto.randomUUID(),
    description: input.description,
    technicianLabel: input.technicianLabel ?? null,
    createdAt: input.createdAt ?? now,
  });
  if (!parsed.success) {
    throw new Error("El reporte no es válido.");
  }

  const report: LocalReport = {
    clientId: parsed.data.clientId,
    description: parsed.data.description,
    technicianLabel: parsed.data.technicianLabel,
    createdAt: parsed.data.createdAt,
    updatedAt: now,
    syncStatus,
    remoteId: null,
    syncedAt: null,
    errorMessage: null,
    attemptCount: 0,
    nextAttemptAt: null,
  };

  await guard(() => db.reports.add(report));
  return report;
}

export async function listLocalReports(
  db: FieldServiceDatabase,
): Promise<LocalReport[]> {
  const rows = await guard(() => db.reports.orderBy("createdAt").toArray());
  return rows.reverse();
}

export async function getLocalReport(
  db: FieldServiceDatabase,
  clientId: string,
): Promise<LocalReport | undefined> {
  return guard(() => db.reports.get(clientId));
}

export async function updateDraft(
  db: FieldServiceDatabase,
  clientId: string,
  input: { description: string; technicianLabel?: string | null },
): Promise<LocalReport> {
  const current = await getLocalReport(db, clientId);
  if (!current || current.syncStatus !== "draft") {
    throw new DraftOnlyError();
  }

  const parsed = createServiceReportSchema.safeParse({
    clientId,
    description: input.description,
    technicianLabel: input.technicianLabel ?? null,
    createdAt: current.createdAt,
  });
  if (!parsed.success) {
    throw new Error("El reporte no es válido.");
  }

  const next: LocalReport = {
    ...current,
    description: parsed.data.description,
    technicianLabel: parsed.data.technicianLabel,
    updatedAt: new Date().toISOString(),
  };
  await guard(() => db.reports.put(next));
  return next;
}

export async function recoverInterruptedSync(
  db: FieldServiceDatabase,
): Promise<void> {
  const now = new Date().toISOString();
  await guard(() =>
    db.reports
      .where("syncStatus")
      .equals("syncing")
      .modify({ syncStatus: "pending", updatedAt: now }),
  );
}

export async function markSyncing(
  db: FieldServiceDatabase,
  clientId: string,
): Promise<void> {
  await patch(db, clientId, { syncStatus: "syncing", errorMessage: null });
}

export async function markSynced(
  db: FieldServiceDatabase,
  clientId: string,
  remoteId: string,
  syncedAt: string,
): Promise<void> {
  await patch(db, clientId, {
    syncStatus: "synced",
    remoteId,
    syncedAt,
    errorMessage: null,
    attemptCount: 0,
    nextAttemptAt: null,
    updatedAt: syncedAt,
  });
}

export async function markSyncError(
  db: FieldServiceDatabase,
  clientId: string,
  errorMessage: string,
  attempt: { attemptCount: number; nextAttemptAt: string | null },
): Promise<void> {
  await patch(db, clientId, {
    syncStatus: "error",
    errorMessage,
    attemptCount: attempt.attemptCount,
    nextAttemptAt: attempt.nextAttemptAt,
  });
}

export async function prepareManualRetry(
  db: FieldServiceDatabase,
): Promise<void> {
  const now = new Date().toISOString();
  const rows = await listLocalReports(db);
  await guard(() =>
    db.transaction("rw", db.reports, async () => {
      for (const row of rows) {
        if (row.syncStatus !== "error" && row.syncStatus !== "pending") {
          continue;
        }
        await db.reports.update(row.clientId, {
          syncStatus: "pending",
          attemptCount: 0,
          nextAttemptAt: null,
          errorMessage: null,
          updatedAt: now,
        });
      }
    }),
  );
}

async function patch(
  db: FieldServiceDatabase,
  clientId: string,
  changes: Partial<LocalReport>,
): Promise<void> {
  await guard(() =>
    db.reports.update(clientId, {
      ...changes,
      updatedAt: changes.updatedAt ?? new Date().toISOString(),
    }),
  );
}

async function guard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DraftOnlyError || error instanceof LocalStorageError) {
      throw error;
    }
    if (
      error instanceof Error &&
      error.message === "El reporte no es válido."
    ) {
      throw error;
    }
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "UnknownError")
    ) {
      throw new LocalStorageError(
        "No hay espacio suficiente para guardar el reporte.",
      );
    }
    throw new LocalStorageError();
  }
}
