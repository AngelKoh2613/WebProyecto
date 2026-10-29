import { desc, eq } from "drizzle-orm";
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

export type StoredServiceReport = ServiceReportRecord;

export type SyncServiceReportResult =
  | { status: "created" | "existing"; report: StoredServiceReport }
  | { status: "conflict" };

type ReportRow = typeof serviceReports.$inferSelect;

export function createReportRepository(db: NodePgDatabase<typeof schema>) {
  return {
    async sync(
      input: CreateServiceReportInput,
    ): Promise<SyncServiceReportResult> {
      const inserted = await db
        .insert(serviceReports)
        .values({
          clientId: input.clientId,
          description: input.description,
          technicianLabel: input.technicianLabel,
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

      if (sameStoredReport(toIdentity(existing), input)) {
        return { status: "existing", report: toRecord(existing) };
      }

      return { status: "conflict" };
    },

    async find(clientId: string): Promise<StoredServiceReport | null> {
      const row = await findRow(db, clientId);
      return row ? toRecord(row) : null;
    },

    async list(): Promise<StoredServiceReport[]> {
      const rows = await db
        .select()
        .from(serviceReports)
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

function toIdentity(row: ReportRow): {
  description: string;
  technicianLabel: string | null;
  createdAt: string;
} {
  return {
    description: row.description,
    technicianLabel: row.technicianLabel,
    createdAt: row.createdAt.toISOString(),
  };
}

function toRecord(row: ReportRow): StoredServiceReport {
  return {
    clientId: row.clientId,
    remoteId: row.id,
    description: row.description,
    technicianLabel: row.technicianLabel,
    createdAt: row.createdAt.toISOString(),
  };
}
