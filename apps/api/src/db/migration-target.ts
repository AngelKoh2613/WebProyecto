const developmentTargets = [
  {
    databaseName: "field_service_dev",
    hosts: ["127.0.0.1", "localhost"],
  },
  {
    databaseName: "appweb_ykvs",
    hosts: ["dpg-dbgc0imgekts738fpndg-a.oregon-postgres.render.com"],
  },
] as const;

export function isDevelopmentMigrationTarget(
  connectionString: string,
): boolean {
  try {
    return matchDevelopmentTarget(connectionString) !== undefined;
  } catch {
    return false;
  }
}

export function assertDevelopmentMigrationTarget(
  connectionString: string,
): void {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to apply migrations");
  }

  let matched: boolean;
  try {
    matched = matchDevelopmentTarget(connectionString) !== undefined;
  } catch {
    throw new Error("DATABASE_URL is invalid");
  }

  if (!matched) {
    throw new Error(
      "Refusing to migrate a database that is not an identified development target",
    );
  }
}

function matchDevelopmentTarget(connectionString: string) {
  const url = new URL(connectionString);
  const databaseName = url.pathname.replace(/^\//, "");
  return developmentTargets.find(
    (target) =>
      target.databaseName === databaseName &&
      (target.hosts as readonly string[]).includes(url.hostname),
  );
}
