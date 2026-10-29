import type {
  ServiceReportListResponse,
  ServiceReportSyncResponse,
} from "@field-service/contracts";
import { createServiceReportSchema } from "@field-service/validation";
import type { FastifyInstance } from "fastify";
import type { ReportRepository } from "../reports/repository.js";
import { toErrorBody } from "../shared/http-errors.js";

export async function registerReportRoutes(
  app: FastifyInstance,
  reports?: ReportRepository,
): Promise<void> {
  app.get("/api/v1/reports", async (_request, reply) => {
    if (!reports) {
      return reply.code(503).send(toErrorBody(503));
    }

    const body: ServiceReportListResponse = {
      reports: await reports.list(),
    };
    return body;
  });

  app.post("/api/v1/reports", async (request, reply) => {
    const parsed = createServiceReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(toErrorBody(400));
    }

    if (!reports) {
      return reply.code(503).send(toErrorBody(503));
    }

    const result = await reports.sync(parsed.data);
    if (result.status === "conflict") {
      return reply.code(409).send(toErrorBody(409));
    }

    const body: ServiceReportSyncResponse = {
      ...result.report,
      outcome: result.status,
    };
    return reply.code(result.status === "created" ? 201 : 200).send(body);
  });

  app.get("/api/v1/reports/:clientId", async (request, reply) => {
    const params = request.params as { clientId?: string };
    const clientId = createServiceReportSchema.shape.clientId.safeParse(
      params.clientId,
    );
    if (!clientId.success) {
      return reply.code(400).send(toErrorBody(400));
    }

    if (!reports) {
      return reply.code(503).send(toErrorBody(503));
    }

    const report = await reports.find(clientId.data);
    if (!report) {
      return reply.code(404).send(toErrorBody(404, "Report not found"));
    }

    return report;
  });
}
