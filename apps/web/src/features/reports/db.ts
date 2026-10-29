import Dexie, { type EntityTable } from "dexie";

export type LocalSyncStatus =
  "draft" | "pending" | "syncing" | "synced" | "error";

export interface LocalReport {
  clientId: string;
  description: string;
  technicianLabel: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalSyncStatus;
  remoteId: string | null;
  syncedAt: string | null;
  errorMessage: string | null;
  attemptCount: number;
  nextAttemptAt: string | null;
}

const DATABASE_NAME = "field-service";

export class FieldServiceDatabase extends Dexie {
  reports!: EntityTable<LocalReport, "clientId">;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(1).stores({
      reports: "clientId, syncStatus, createdAt",
    });
  }
}

let shared: FieldServiceDatabase | undefined;

export function fieldServiceDatabase(): FieldServiceDatabase {
  shared ??= new FieldServiceDatabase();
  return shared;
}
