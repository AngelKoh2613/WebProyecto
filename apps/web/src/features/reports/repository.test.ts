import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { FieldServiceDatabase } from "./db";
import {
  DraftOnlyError,
  LocalStorageError,
  createLocalReport,
  getLocalReport,
  listLocalReports,
  updateDraft,
} from "./repository";
import type { FieldServiceDatabase as ReportDatabase } from "./db";
import { syncReportQueue } from "./sync";

const databases: FieldServiceDatabase[] = [];

function openDatabase(): FieldServiceDatabase {
  const db = new FieldServiceDatabase(`field-service-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}

afterEach(() => {
  for (const db of databases) db.close();
  databases.length = 0;
});

describe("local reports", () => {
  it("keeps the message when the device has no storage space", async () => {
    const db = {
      reports: {
        add: async () => {
          throw new DOMException("quota", "QuotaExceededError");
        },
      },
    } as unknown as ReportDatabase;

    await expect(
      createLocalReport(db, { description: "Sin espacio" }, "pending"),
    ).rejects.toMatchObject({
      name: "LocalStorageError",
      message: "No hay espacio suficiente para guardar el reporte.",
    });
    expect(LocalStorageError).toBeDefined();
  });

  it("creates a report and reads it back from a new database connection", async () => {
    const name = `field-service-${crypto.randomUUID()}`;
    const first = new FieldServiceDatabase(name);
    const created = await createLocalReport(
      first,
      { description: "La bomba no arranca" },
      "pending",
    );
    first.close();

    const second = new FieldServiceDatabase(name);
    databases.push(second);
    const stored = await getLocalReport(second, created.clientId);

    expect(stored?.description).toBe("La bomba no arranca");
    expect(stored?.syncStatus).toBe("pending");
    expect(stored?.remoteId).toBeNull();
  });

  it("keeps a pending report and records the error when the network fails", async () => {
    const db = openDatabase();
    const created = await createLocalReport(
      db,
      { description: "Cable cortado" },
      "pending",
    );

    await syncReportQueue(
      db,
      {
        async send() {
          return { status: "retryable" };
        },
      },
      { now: Date.now(), online: true },
    );

    const stored = await getLocalReport(db, created.clientId);
    expect(stored?.description).toBe("Cable cortado");
    expect(stored?.syncStatus).toBe("error");
    expect(stored?.errorMessage).toMatch(/sigue en este dispositivo/i);
    expect(stored?.attemptCount).toBe(1);
  });

  it("leaves the report pending while the browser is offline", async () => {
    const db = openDatabase();
    const created = await createLocalReport(
      db,
      { description: "Sin señal" },
      "pending",
    );

    const summary = await syncReportQueue(
      db,
      {
        async send() {
          throw new Error("should not send");
        },
      },
      { now: Date.now(), online: false },
    );

    expect(summary).toEqual({ synced: [], failed: [] });
    expect((await getLocalReport(db, created.clientId))?.syncStatus).toBe(
      "pending",
    );
  });

  it("updates a draft and refuses to change a synced report", async () => {
    const db = openDatabase();
    const draft = await createLocalReport(
      db,
      { description: "Borrador inicial" },
      "draft",
    );

    const updated = await updateDraft(db, draft.clientId, {
      description: "Borrador corregido",
    });
    expect(updated.description).toBe("Borrador corregido");

    const queued = await createLocalReport(
      db,
      { description: "Ya enviado" },
      "pending",
    );
    await syncReportQueue(
      db,
      {
        async send() {
          return { status: "synced", remoteId: crypto.randomUUID() };
        },
      },
      { now: Date.now(), online: true },
    );

    await expect(
      updateDraft(db, queued.clientId, { description: "Cambio tardío" }),
    ).rejects.toBeInstanceOf(DraftOnlyError);
    expect((await getLocalReport(db, queued.clientId))?.description).toBe(
      "Ya enviado",
    );
  });

  it("continues the queue when one report fails", async () => {
    const db = openDatabase();
    const first = await createLocalReport(
      db,
      { description: "Falla primero", createdAt: "2026-10-27T12:00:00.000Z" },
      "pending",
    );
    const second = await createLocalReport(
      db,
      { description: "Pasa después", createdAt: "2026-10-27T12:05:00.000Z" },
      "pending",
    );

    const summary = await syncReportQueue(
      db,
      {
        async send(report) {
          if (report.clientId === first.clientId)
            return { status: "retryable" };
          return { status: "synced", remoteId: crypto.randomUUID() };
        },
      },
      { now: Date.parse("2026-10-27T13:00:00.000Z"), online: true },
    );

    expect(summary.failed).toEqual([first.clientId]);
    expect(summary.synced).toEqual([second.clientId]);
    expect(
      (await listLocalReports(db)).map((row) => row.syncStatus).sort(),
    ).toEqual(["error", "synced"]);
  });

  it("retries a lost response without treating the local copy as deleted", async () => {
    const db = openDatabase();
    const created = await createLocalReport(
      db,
      { description: "Respuesta perdida" },
      "pending",
    );
    const remoteId = crypto.randomUUID();
    let stored = false;
    let attempts = 0;

    await syncReportQueue(
      db,
      {
        async send() {
          attempts += 1;
          stored = true;
          return { status: "retryable" };
        },
      },
      { now: Date.now(), online: true },
    );
    expect((await getLocalReport(db, created.clientId))?.syncStatus).toBe(
      "error",
    );

    await syncReportQueue(
      db,
      {
        async send() {
          attempts += 1;
          if (!stored) throw new Error("missing remote row");
          return { status: "synced", remoteId };
        },
      },
      { now: Date.now() + 10_000, online: true, manual: true },
    );

    const storedLocally = await getLocalReport(db, created.clientId);
    expect(attempts).toBe(2);
    expect(storedLocally?.syncStatus).toBe("synced");
    expect(storedLocally?.remoteId).toBe(remoteId);
    expect(storedLocally?.description).toBe("Respuesta perdida");
  });
});
