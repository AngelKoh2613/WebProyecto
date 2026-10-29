import {
  API_SERVICE_NAME,
  API_VERSION,
  type ApiIndexResponse,
  type HealthResponse,
  type ReadinessResponse,
} from "@field-service/contracts";
import type { FastifyInstance } from "fastify";
import type { DatabaseProbe } from "../db/client.js";

const notConfigured: ReadinessResponse = {
  status: "not_ready",
  checks: { database: "not_configured" },
};

const down: ReadinessResponse = {
  status: "not_ready",
  checks: { database: "down" },
};

const ready: ReadinessResponse = {
  status: "ready",
  checks: { database: "up" },
};

export async function registerSystemRoutes(
  app: FastifyInstance,
  database?: DatabaseProbe,
): Promise<void> {
  app.get("/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      service: API_SERVICE_NAME,
    };
  });

  app.get("/health/ready", async (request, reply) => {
    if (!database) {
      return reply.code(503).send(notConfigured);
    }

    try {
      await database.ping();
      return ready;
    } catch {
      request.log.warn({ message: "database readiness check failed" });
      return reply.code(503).send(down);
    }
  });

  app.get("/api/v1", async (): Promise<ApiIndexResponse> => {
    return {
      service: API_SERVICE_NAME,
      version: API_VERSION,
      status: "initial",
    };
  });
}
