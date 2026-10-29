import { describe, expect, it } from "vitest";
import { assertDevelopmentMigrationTarget } from "../src/db/migration-target.js";

const localUrl = "postgresql://USER:PASSWORD@127.0.0.1:5432/field_service_dev";
const provisionedUrl =
  "postgresql://USER:PASSWORD@dpg-dbgc0imgekts738fpndg-a.oregon-postgres.render.com:5432/appweb_ykvs?sslmode=require";

describe("development migration target", () => {
  it("accepts the local development database", () => {
    expect(() => assertDevelopmentMigrationTarget(localUrl)).not.toThrow();
  });

  it("accepts the provisioned development database", () => {
    expect(() =>
      assertDevelopmentMigrationTarget(provisionedUrl),
    ).not.toThrow();
  });

  it("refuses another database on the same host", () => {
    expect(() =>
      assertDevelopmentMigrationTarget(
        "postgresql://USER:PASSWORD@dpg-dbgc0imgekts738fpndg-a.oregon-postgres.render.com/production_db",
      ),
    ).toThrow(
      "Refusing to migrate a database that is not an identified development target",
    );
  });

  it("refuses the provisioned name on another host", () => {
    expect(() =>
      assertDevelopmentMigrationTarget(
        "postgresql://USER:PASSWORD@other.example/appweb_ykvs",
      ),
    ).toThrow(
      "Refusing to migrate a database that is not an identified development target",
    );
  });

  it("does not include the password in the refusal", () => {
    const secret = "super-secret-value";
    expect(() =>
      assertDevelopmentMigrationTarget(
        `postgresql://USER:${secret}@127.0.0.1:5432/other_database`,
      ),
    ).toThrow(expect.not.stringContaining(secret));
  });
});
