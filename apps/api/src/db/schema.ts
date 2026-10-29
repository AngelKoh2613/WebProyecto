import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
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

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check("users_name_length", sql`char_length("name") between 1 and 80`),
    check("users_email_length", sql`char_length("email") between 3 and 254`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)],
);

export const serviceReports = pgTable(
  "service_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull(),
    userId: uuid("user_id").references(() => users.id),
    description: text("description").notNull(),
    technicianLabel: text("technician_label"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
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
    check(
      "service_reports_latitude_range",
      sql`"latitude" is null or ("latitude" >= -90 and "latitude" <= 90)`,
    ),
    check(
      "service_reports_longitude_range",
      sql`"longitude" is null or ("longitude" >= -180 and "longitude" <= 180)`,
    ),
  ],
);
