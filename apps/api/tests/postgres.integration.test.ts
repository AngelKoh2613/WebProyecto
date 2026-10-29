import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { createAccountRepository } from "../src/auth/repository.js";
import { createDatabase } from "../src/db/client.js";
import { isDevelopmentMigrationTarget } from "../src/db/migration-target.js";
import { createReportRepository } from "../src/reports/repository.js";
import {
  infrastructureChecks,
  serviceReports,
  sessions,
  users,
} from "../src/db/schema.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const envFile = path.join(repositoryRoot, ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const connectionString = process.env.DATABASE_URL;
const canUseDevelopmentDatabase = connectionString
  ? isDevelopmentMigrationTarget(connectionString)
  : false;

describe.skipIf(!canUseDevelopmentDatabase)(
  "PostgreSQL integration against the identified development database",
  () => {
    const database = createDatabase(connectionString ?? "");

    afterAll(async () => {
      await database.close();
    });

    it("applies the additive migration and reads back one technical row", async () => {
      const migrationsFolder = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../database/migrations",
      );

      await migrate(database.db, { migrationsFolder });
      const note = `phase-2-${Date.now()}`;
      const inserted = await database.db
        .insert(infrastructureChecks)
        .values({ note })
        .returning({ id: infrastructureChecks.id });
      const id = inserted[0]?.id;

      try {
        expect(id).toBeDefined();

        const rows = await database.db
          .select({ note: infrastructureChecks.note })
          .from(infrastructureChecks)
          .where(eq(infrastructureChecks.id, id ?? ""));

        expect(rows).toEqual([{ note }]);
        await database.ping();
      } finally {
        if (id) {
          await database.db
            .delete(infrastructureChecks)
            .where(eq(infrastructureChecks.id, id));
        }
      }
    }, 20_000);

    it("keeps a single remote report when the same client id is repeated", async () => {
      const migrationsFolder = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../database/migrations",
      );
      await migrate(database.db, { migrationsFolder });
      const reports = createReportRepository(database.db);
      const accounts = createAccountRepository(database.db);
      const clientId = randomUUID();
      const registered = await accounts.register({
        name: "Integracion",
        email: `integracion-${clientId}@example.test`,
        password: "password12",
      });
      if (registered === "exists") {
        throw new Error("The integration account already existed");
      }
      const input = {
        clientId,
        description: "Reporte de integración",
        technicianLabel: null,
        latitude: 19.4326,
        longitude: -99.1332,
        createdAt: "2026-10-27T18:30:00.000Z",
      };

      try {
        const created = await reports.sync(input, registered);
        const repeated = await reports.sync(input, registered);
        const conflict = await reports.sync(
          {
            ...input,
            description: "Contenido distinto",
          },
          registered,
        );
        const rows = await database.db
          .select({
            id: serviceReports.id,
            description: serviceReports.description,
          })
          .from(serviceReports)
          .where(eq(serviceReports.clientId, clientId));

        expect(created.status).toBe("created");
        expect(repeated.status).toBe("existing");
        if (created.status === "created" && repeated.status === "existing") {
          expect(repeated.report.remoteId).toBe(created.report.remoteId);
        }
        expect(conflict.status).toBe("conflict");
        expect(rows).toHaveLength(1);
        expect(rows[0]?.description).toBe("Reporte de integración");
      } finally {
        await database.db
          .delete(sessions)
          .where(eq(sessions.userId, registered.id));
        await database.db
          .delete(serviceReports)
          .where(eq(serviceReports.clientId, clientId));
        await database.db.delete(users).where(eq(users.id, registered.id));
      }
    }, 20_000);
  },
);
