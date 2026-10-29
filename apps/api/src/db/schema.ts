import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const infrastructureChecks = pgTable("infrastructure_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const serviceReports = pgTable(
  "service_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull(),
    description: text("description").notNull(),
    technicianLabel: text("technician_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("service_reports_client_id_unique").on(table.clientId),
    check(
      "service_reports_description_length",
      sql`char_length("description") between 1 and 2000`,
    ),
    check(
      "service_reports_technician_label_length",
      sql`"technician_label" is null or char_length("technician_label") between 1 and 80`,
    ),
  ],
);
