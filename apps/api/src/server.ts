import { existsSync } from "node:fs";
import path from "node:path";
import { createDatabase } from "./db/client.js";
import { createReportRepository } from "./reports/repository.js";
import { loadEnv } from "./config/env.js";
import { buildApp } from "./app/build-app.js";
import { productionWebDist } from "./web/client-root.js";

const env = loadEnv();
const database = env.DATABASE_URL
  ? createDatabase(env.DATABASE_URL)
  : undefined;

let webRoot: string | undefined;
if (env.NODE_ENV === "production") {
  webRoot = productionWebDist();
  if (!existsSync(path.join(webRoot, "index.html"))) {
    throw new Error(
      "The production web build is missing. Run pnpm build before starting the server.",
    );
  }
}

const app = await buildApp({
  logger: {
    level: env.LOG_LEVEL,
  },
  ...(database
    ? { database, reports: createReportRepository(database.db) }
    : {}),
  ...(env.CORS_ORIGIN ? { corsOrigin: env.CORS_ORIGIN } : {}),
  ...(webRoot ? { webRoot } : {}),
});

try {
  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info({
    databaseConfigured: Boolean(env.DATABASE_URL),
    corsEnabled: Boolean(env.CORS_ORIGIN),
  });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app.close().catch((closeError: unknown) => {
      app.log.error(closeError);
      process.exit(1);
    });
  });
}
