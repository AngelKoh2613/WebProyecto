import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationsDirectory = new URL(
  "../../../database/migrations/",
  import.meta.url,
);

describe("versioned migrations", () => {
  it("adds tables without destroying existing data", () => {
    const sqlFiles = readdirSync(migrationsDirectory).filter((name) =>
      name.endsWith(".sql"),
    );

    expect(sqlFiles).toContain("0000_create_infrastructure_checks.sql");
    expect(sqlFiles).toContain("0001_create_service_reports.sql");
    expect(sqlFiles).toContain("0002_add_accounts_and_coordinates.sql");

    for (const name of sqlFiles) {
      const sql = readFileSync(
        new URL(name, migrationsDirectory),
        "utf8",
      ).toLowerCase();

      expect(sql).not.toMatch(/\bdrop\b/);
      expect(sql).not.toMatch(/\btruncate\b/);
      expect(sql).not.toMatch(/\bdelete\s+from\b/);
    }

    const reports = readFileSync(
      new URL("0001_create_service_reports.sql", migrationsDirectory),
      "utf8",
    ).toLowerCase();
    expect(reports).toContain("service_reports_client_id_unique");
    expect(reports).toContain('create table "service_reports"');
  });
});
