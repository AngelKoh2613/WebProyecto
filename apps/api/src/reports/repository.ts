import { desc, eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ServiceReportRecord } from "@field-service/contracts";
import type { createServiceReportSchema } from "@field-service/validation";
import type * as z from "zod";
import type * as schema from "../db/schema.js";
import { serviceReports } from "../db/schema.js";
import { sameStoredReport } from "./compare.js";

export type CreateServiceReportInput = z.infer<
  typeof createServiceReportSchema
>;

export interface ReportOwner {
  id: string;
  name: string;
}

export type StoredServiceReport = ServiceReportRecord;

export type SyncServiceReportResult =
  | { status: "created"; report: StoredServiceReport }
  | { status: "existing"; report: StoredServiceReport }
  | { status: "conflict" }
  | { status: "forbidden" };

type ReportRow = typeof serviceReports.$inferSelect;

export function createReportRepository(db: NodePgDatabase<typeof schema>) {
  return {
    async sync(
      input: CreateServiceReportInput,
      user: ReportOwner,
    ): Promise<SyncServiceReportResult> {
      const inserted = await db
        .insert(serviceReports)
        .values({
          clientId: input.clientId,
          userId: user.id,
          description: input.description,
          technicianLabel: user.name,
          latitude: input.latitude,
          longitude: input.longitude,
          createdAt: new Date(input.createdAt),
        })
        .onConflictDoNothing({ target: serviceReports.clientId })
        .returning();
      const created = inserted[0];
      if (created) {
        return { status: "created", report: toRecord(created) };
      }

      const existing = await findRow(db, input.clientId);
      if (!existing) {
        throw new Error("The report insert did not return a row");
      }
      if (existing.userId && existing.userId !== user.id) {
        return { status: "forbidden" };
      }
      if (!sameStoredReport(toIdentity(existing), input)) {
        return { status: "conflict" };
      }

      const needsFill =
        !existing.userId ||
        existing.latitude === null ||
        existing.longitude === null ||
        !existing.technicianLabel;
      if (!needsFill) {
        return { status: "existing", report: toRecord(existing) };
      }

      const updated = await db
        .update(serviceReports)
        .set({
          userId: user.id,
          technicianLabel: existing.technicianLabel ?? user.name,
          latitude: existing.latitude ?? input.latitude,
          longitude: existing.longitude ?? input.longitude,
        })
        .where(eq(serviceReports.clientId, input.clientId))
        .returning();
      const row = updated[0];
      if (!row) {
        throw new Error("The report update did not return a row");
      }
      return { status: "existing", report: toRecord(row) };
    },

    async find(
      clientId: string,
      userId: string,
    ): Promise<StoredServiceReport | null> {
      const row = await findRow(db, clientId);
      if (!row || row.userId !== userId) return null;
      return toRecord(row);
    },

    async claimUnassigned(userId: string): Promise<void> {
      await db
        .update(serviceReports)
        .set({ userId })
        .where(isNull(serviceReports.userId));
    },

    async list(userId: string): Promise<StoredServiceReport[]> {
      const rows = await db
        .select()
        .from(serviceReports)
        .where(eq(serviceReports.userId, userId))
        .orderBy(desc(serviceReports.createdAt));
      return rows.map(toRecord);
    },
  };
}

export type ReportRepository = ReturnType<typeof createReportRepository>;

async function findRow(
  db: NodePgDatabase<typeof schema>,
  clientId: string,
): Promise<ReportRow | undefined> {
  const rows = await db
    .select()
    .from(serviceReports)
    .where(eq(serviceReports.clientId, clientId))
    .limit(1);
  return rows[0];
}

function toIdentity(row: ReportRow) {
  return {
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

function toRecord(row: ReportRow): StoredServiceReport {
  return {
    clientId: row.clientId,
    remoteId: row.id,
    description: row.description,
    technicianLabel: row.technicianLabel,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt.toISOString(),
  };
}
