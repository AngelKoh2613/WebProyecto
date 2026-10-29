import { randomUUID } from "node:crypto";
import {
  apiErrorBodySchema,
  serviceReportSyncResponseSchema,
} from "@field-service/validation";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/build-app.js";
import { sameStoredReport } from "../src/reports/compare.js";
import type {
  CreateServiceReportInput,
  ReportRepository,
  StoredServiceReport,
} from "../src/reports/repository.js";
import { toErrorBody } from "../src/shared/http-errors.js";

function memoryReports(): ReportRepository & { rows: StoredServiceReport[] } {
  const rows: StoredServiceReport[] = [];
  return {
    rows,
    async sync(input: CreateServiceReportInput) {
      const existing = rows.find((row) => row.clientId === input.clientId);
      if (!existing) {
        const report: StoredServiceReport = {
          clientId: input.clientId,
          remoteId: randomUUID(),
          description: input.description,
          technicianLabel: input.technicianLabel,
          createdAt: new Date(input.createdAt).toISOString(),
        };
        rows.push(report);
        return { status: "created", report };
      }
      if (
        sameStoredReport(
          {
            description: existing.description,
            technicianLabel: existing.technicianLabel,
            createdAt: existing.createdAt,
          },
          input,
        )
      ) {
        return { status: "existing", report: existing };
      }
      return { status: "conflict" };
    },
    async find(clientId) {
      return rows.find((row) => row.clientId === clientId) ?? null;
    },
  };
}

describe("service report routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("rejects an empty description", async () => {
    app = await buildApp({ logger: false, reports: memoryReports() });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: {
        clientId: randomUUID(),
        description: "   ",
        createdAt: "2026-10-27T18:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(apiErrorBodySchema.parse(response.json())).toEqual(toErrorBody(400));
  });

  it("creates a report and returns the same row when the request is repeated", async () => {
    const reports = memoryReports();
    app = await buildApp({ logger: false, reports });
    const payload = {
      clientId: randomUUID(),
      description: "Fuga en la válvula",
      createdAt: "2026-10-27T18:00:00.000Z",
    };

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload,
    });
    const repeated = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload,
    });

    expect(created.statusCode).toBe(201);
    expect(repeated.statusCode).toBe(200);
    const first = serviceReportSyncResponseSchema.parse(created.json());
    const second = serviceReportSyncResponseSchema.parse(repeated.json());
    expect(first.outcome).toBe("created");
    expect(second).toMatchObject({
      outcome: "existing",
      remoteId: first.remoteId,
      description: payload.description,
    });
    expect(reports.rows).toHaveLength(1);
  });

  it("does not replace a stored report when the same id arrives with other content", async () => {
    const reports = memoryReports();
    app = await buildApp({ logger: false, reports });
    const clientId = randomUUID();

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: {
        clientId,
        description: "Texto original",
        createdAt: "2026-10-27T18:00:00.000Z",
      },
    });
    const conflict = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: {
        clientId,
        description: "Texto distinto",
        createdAt: "2026-10-27T18:00:00.000Z",
      },
    });

    expect(conflict.statusCode).toBe(409);
    expect(conflict.json()).toEqual(toErrorBody(409));
    expect(reports.rows[0]?.description).toBe("Texto original");
  });

  it("returns 503 when storage is not configured", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: {
        clientId: randomUUID(),
        description: "Sin base",
        createdAt: "2026-10-27T18:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual(toErrorBody(503));
  });

  it("returns the stored report by its client id", async () => {
    const reports = memoryReports();
    app = await buildApp({ logger: false, reports });
    const payload = {
      clientId: randomUUID(),
      description: "Consulta por identificador",
      createdAt: "2026-10-27T18:00:00.000Z",
    };

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload,
    });
    const found = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${payload.clientId}`,
    });
    const missing = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${randomUUID()}`,
    });

    expect(found.statusCode).toBe(200);
    expect(found.json()).toMatchObject({
      clientId: payload.clientId,
      description: payload.description,
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual(toErrorBody(404, "Report not found"));
  });
});
