import Dexie, { type EntityTable } from "dexie";

export type LocalSyncStatus =
  "draft" | "pending" | "syncing" | "synced" | "error";

export interface LocalReport {
  clientId: string;
  userId: string | null;
  description: string;
  technicianLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalSyncStatus;
  remoteId: string | null;
  syncedAt: string | null;
  errorMessage: string | null;
  attemptCount: number;
  nextAttemptAt: string | null;
}

export interface LocalAccount {
  id: "current";
  userId: string;
  name: string;
  email: string;
}

const DATABASE_NAME = "field-service";

export class FieldServiceDatabase extends Dexie {
  reports!: EntityTable<LocalReport, "clientId">;
  account!: EntityTable<LocalAccount, "id">;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(1).stores({
      reports: "clientId, syncStatus, createdAt",
    });
    this.version(2).stores({
      reports: "clientId, userId, syncStatus, createdAt",
      account: "id",
    });
  }
}

let shared: FieldServiceDatabase | undefined;

export function fieldServiceDatabase(): FieldServiceDatabase {
  shared ??= new FieldServiceDatabase();
  return shared;
}
