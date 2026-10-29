import { defineConfig } from "drizzle-kit";
import { assertDevelopmentMigrationTarget } from "./src/db/migration-target.js";

const databaseUrl = process.env.DATABASE_URL;
const applyingMigration = process.argv.some((argument) =>
  argument.includes("migrate"),
);

if (applyingMigration) {
  assertDevelopmentMigrationTarget(databaseUrl ?? "");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "../../database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      databaseUrl ??
      "postgresql://USER:PASSWORD@127.0.0.1:5432/field_service_dev",
  },
});
