import compress from "@fastify/compress";
import Fastify, { type FastifyServerOptions } from "fastify";
import type { DatabaseProbe } from "../db/client.js";
import { registerCors } from "../plugins/cors.js";
import { registerSecurity } from "../plugins/security.js";
import type { ReportRepository } from "../reports/repository.js";
import { registerReportRoutes } from "../routes/reports.js";
import { registerSystemRoutes } from "../routes/system.js";
import { statusCodeOf, toErrorBody } from "../shared/http-errors.js";
import { registerWebClient } from "../web/register-client.js";

type BuildOptions = FastifyServerOptions & {
  database?: DatabaseProbe;
  reports?: ReportRepository;
  corsOrigin?: string;
  webRoot?: string;
};

export async function buildApp(options: BuildOptions = {}) {
  const { database, reports, corsOrigin, webRoot, ...fastifyOptions } = options;
  const app = Fastify(fastifyOptions);

  await registerSecurity(app);
  await app.register(compress, { global: true, threshold: 1024 });
  if (corsOrigin) {
    await registerCors(app, corsOrigin);
  }

  app.addHook("onClose", async () => {
    await database?.close();
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    request.log.error({ message: "request failed" });
    const statusCode = statusCodeOf(error);
    return reply.code(statusCode).send(toErrorBody(statusCode));
  });

  await registerSystemRoutes(app, database);
  await registerReportRoutes(app, reports);

  if (webRoot) {
    await registerWebClient(app, webRoot);
  } else {
    app.setNotFoundHandler((_request, reply) => {
      return reply.code(404).send(toErrorBody(404));
    });
  }

  return app;
}
