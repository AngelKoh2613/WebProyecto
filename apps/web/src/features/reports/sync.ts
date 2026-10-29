import { serviceReportSyncResponseSchema } from "@field-service/validation";
import type { FieldServiceDatabase, LocalReport } from "./db";
import {
  listLocalReports,
  markSyncError,
  markSynced,
  markSyncing,
  recoverInterruptedSync,
} from "./repository";
import {
  MAX_SYNC_ATTEMPTS,
  isRetryableHttpStatus,
  retryDelayMs,
} from "./sync-policy";

export type SendResult =
  | { status: "synced"; remoteId: string }
  | { status: "conflict" }
  | { status: "rejected" }
  | { status: "retryable" };

export interface ReportSender {
  send(report: LocalReport): Promise<SendResult>;
}

export interface SyncSummary {
  synced: string[];
  failed: string[];
}

let activeSync: Promise<SyncSummary> | null = null;

export function syncReportQueue(
  db: FieldServiceDatabase,
  sender: ReportSender,
  options: { now: number; online: boolean; manual?: boolean },
): Promise<SyncSummary> {
  if (activeSync) return activeSync;
  activeSync = runSync(db, sender, options).finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function runSync(
  db: FieldServiceDatabase,
  sender: ReportSender,
  options: { now: number; online: boolean; manual?: boolean },
): Promise<SyncSummary> {
  await recoverInterruptedSync(db);
  if (!options.online) {
    return { synced: [], failed: [] };
  }

  const reports = (await listLocalReports(db)).slice().reverse();
  const summary: SyncSummary = { synced: [], failed: [] };

  for (const report of reports) {
    if (!shouldSend(report, options)) continue;
    await markSyncing(db, report.clientId);
    const result = await sender.send(report);
    if (result.status === "synced") {
      await markSynced(
        db,
        report.clientId,
        result.remoteId,
        new Date(options.now).toISOString(),
      );
      summary.synced.push(report.clientId);
      continue;
    }

    const attemptCount = report.attemptCount + 1;
    const retry =
      result.status === "retryable" && attemptCount < MAX_SYNC_ATTEMPTS;
    await markSyncError(db, report.clientId, errorText(result.status), {
      attemptCount,
      nextAttemptAt: retry
        ? new Date(options.now + retryDelayMs(attemptCount)).toISOString()
        : null,
    });
    summary.failed.push(report.clientId);
  }

  return summary;
}

function shouldSend(
  report: LocalReport,
  options: { now: number; manual?: boolean },
): boolean {
  if (report.syncStatus !== "pending" && report.syncStatus !== "error") {
    return false;
  }
  if (options.manual) return true;
  if (report.attemptCount >= MAX_SYNC_ATTEMPTS) return false;
  if (report.nextAttemptAt && Date.parse(report.nextAttemptAt) > options.now) {
    return false;
  }
  return true;
}

function errorText(status: Exclude<SendResult["status"], "synced">): string {
  if (status === "conflict") {
    return "Este identificador ya existe en el servidor con otro contenido. El reporte sigue en este dispositivo.";
  }
  if (status === "rejected") {
    return "El servidor rechazó el reporte. Sigue guardado en este dispositivo.";
  }
  return "No hubo respuesta del servidor. El reporte sigue en este dispositivo.";
}

export function createHttpReportSender(baseUrl: string): ReportSender {
  return {
    async send(report) {
      try {
        const response = await fetch(`${baseUrl}/api/v1/reports`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            clientId: report.clientId,
            description: report.description,
            technicianLabel: report.technicianLabel,
            createdAt: report.createdAt,
          }),
        });
        if (response.status === 200 || response.status === 201) {
          const body = serviceReportSyncResponseSchema.parse(
            await response.json(),
          );
          return { status: "synced", remoteId: body.remoteId };
        }
        if (response.status === 409) return { status: "conflict" };
        if (isRetryableHttpStatus(response.status))
          return { status: "retryable" };
        return { status: "rejected" };
      } catch {
        return { status: "retryable" };
      }
    },
  };
}
