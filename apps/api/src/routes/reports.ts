import type {
  ServiceReportListResponse,
  ServiceReportSyncResponse,
} from "@field-service/contracts";
import { createServiceReportSchema } from "@field-service/validation";
import type { FastifyInstance } from "fastify";
import type { AccountRepository } from "../auth/repository.js";
import { readRequestUser } from "../auth/request-user.js";
import type { ReportRepository } from "../reports/repository.js";
import { toErrorBody } from "../shared/http-errors.js";

export async function registerReportRoutes(
  app: FastifyInstance,
  options: {
    reports?: ReportRepository;
    accounts?: AccountRepository;
  } = {},
): Promise<void> {
  const { reports, accounts } = options;

  app.get("/api/v1/reports", async (request, reply) => {
    if (!reports || !accounts) {
      return reply.code(503).send(toErrorBody(503));
    }
    const user = await readRequestUser(request, accounts);
    if (!user) {
      return reply.code(401).send(toErrorBody(401));
    }

    await reports.claimUnassigned(user.id);
    const body: ServiceReportListResponse = {
      reports: await reports.list(user.id),
    };
    return body;
  });

  app.post("/api/v1/reports", async (request, reply) => {
    const parsed = createServiceReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(toErrorBody(400));
    }
    if (!reports || !accounts) {
      return reply.code(503).send(toErrorBody(503));
    }
    const user = await readRequestUser(request, accounts);
    if (!user) {
      return reply.code(401).send(toErrorBody(401));
    }

    const result = await reports.sync(parsed.data, user);
    if (result.status === "forbidden") {
      return reply.code(404).send(toErrorBody(404, "Report not found"));
    }
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
    if (!reports || !accounts) {
      return reply.code(503).send(toErrorBody(503));
    }
    const user = await readRequestUser(request, accounts);
    if (!user) {
      return reply.code(401).send(toErrorBody(401));
    }

    const report = await reports.find(clientId.data, user.id);
    if (!report) {
      return reply.code(404).send(toErrorBody(404, "Report not found"));
    }
    return report;
  });
}
