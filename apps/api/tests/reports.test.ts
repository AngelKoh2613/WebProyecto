import { randomUUID } from "node:crypto";
import {
  apiErrorBodySchema,
  serviceReportSyncResponseSchema,
} from "@field-service/validation";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AccountRepository, AccountUser } from "../src/auth/repository.js";
import { buildApp } from "../src/app/build-app.js";
import { sameStoredReport } from "../src/reports/compare.js";
import type {
  CreateServiceReportInput,
  ReportOwner,
  ReportRepository,
  StoredServiceReport,
} from "../src/reports/repository.js";
import { toErrorBody } from "../src/shared/http-errors.js";

const owner: AccountUser = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ana Ruiz",
  email: "ana@example.test",
};

const other: AccountUser = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Luis Mora",
  email: "luis@example.test",
};

function memoryAccounts(): AccountRepository & {
  sessions: Map<string, string>;
} {
  const people = new Map<string, AccountUser>([
    [owner.email, owner],
    [other.email, other],
  ]);
  const passwords = new Map<string, string>([
    [owner.email, "password12"],
    [other.email, "password12"],
  ]);
  const sessions = new Map<string, string>([
    ["session-ana", owner.id],
    ["session-luis", other.id],
  ]);

  return {
    sessions,
    async register(input) {
      const email = input.email.toLowerCase();
      if (people.has(email)) return "exists";
      const user = { id: randomUUID(), name: input.name, email };
      people.set(email, user);
      passwords.set(email, input.password);
      return user;
    },
    async authenticate(email, password) {
      const user = people.get(email.toLowerCase());
      if (!user || passwords.get(email.toLowerCase()) !== password) return null;
      return user;
    },
    async createSession(userId) {
      const token = randomUUID();
      sessions.set(token, userId);
      return { token, expiresAt: new Date(Date.now() + 60_000) };
    },
    async readSession(token) {
      const userId = sessions.get(token);
      return [...people.values()].find((user) => user.id === userId) ?? null;
    },
    async deleteSession(token) {
      sessions.delete(token);
    },
  };
}

function memoryReports(): ReportRepository & {
  rows: Array<StoredServiceReport & { userId: string | null }>;
} {
  const rows: Array<StoredServiceReport & { userId: string | null }> = [];
  return {
    rows,
    async sync(input: CreateServiceReportInput, user: ReportOwner) {
      const existing = rows.find((row) => row.clientId === input.clientId);
      if (!existing) {
        const report = {
          clientId: input.clientId,
          remoteId: randomUUID(),
          description: input.description,
          technicianLabel: user.name,
          latitude: input.latitude,
          longitude: input.longitude,
          createdAt: new Date(input.createdAt).toISOString(),
          userId: user.id,
        };
        rows.push(report);
        return { status: "created", report };
      }
      if (existing.userId && existing.userId !== user.id) {
        return { status: "forbidden" };
      }
      if (
        sameStoredReport(
          {
            description: existing.description,
            createdAt: existing.createdAt,
            latitude: existing.latitude,
            longitude: existing.longitude,
          },
          input,
        )
      ) {
        existing.userId = user.id;
        existing.latitude ??= input.latitude;
        existing.longitude ??= input.longitude;
        existing.technicianLabel ??= user.name;
        return { status: "existing", report: existing };
      }
      return { status: "conflict" };
    },
    async find(clientId, userId) {
      return (
        rows.find(
          (row) => row.clientId === clientId && row.userId === userId,
        ) ?? null
      );
    },
    async claimUnassigned(userId) {
      for (const row of rows) {
        if (!row.userId) row.userId = userId;
      }
    },
    async list(userId) {
      return rows.filter((row) => row.userId === userId);
    },
  };
}

function reportPayload(clientId = randomUUID()) {
  return {
    clientId,
    description: "Fuga en la válvula",
    latitude: 19.4326,
    longitude: -99.1332,
    createdAt: "2026-10-27T18:00:00.000Z",
  };
}

describe("service report routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("rejects an empty description", async () => {
    app = await buildApp({
      logger: false,
      reports: memoryReports(),
      accounts: memoryAccounts(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload: {
        ...reportPayload(),
        description: "   ",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(apiErrorBodySchema.parse(response.json())).toEqual(toErrorBody(400));
  });

  it("requires a session before storing a report", async () => {
    app = await buildApp({
      logger: false,
      reports: memoryReports(),
      accounts: memoryAccounts(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: reportPayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual(toErrorBody(401));
  });

  it("creates a report and returns the same row when the request is repeated", async () => {
    const reports = memoryReports();
    app = await buildApp({
      logger: false,
      reports,
      accounts: memoryAccounts(),
    });
    const payload = reportPayload();

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload,
    });
    const repeated = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload,
    });

    expect(created.statusCode).toBe(201);
    expect(repeated.statusCode).toBe(200);
    const first = serviceReportSyncResponseSchema.parse(created.json());
    const second = serviceReportSyncResponseSchema.parse(repeated.json());
    expect(first.outcome).toBe("created");
    expect(first.technicianLabel).toBe(owner.name);
    expect(first.latitude).toBe(payload.latitude);
    expect(second).toMatchObject({
      outcome: "existing",
      remoteId: first.remoteId,
      description: payload.description,
    });
    expect(reports.rows).toHaveLength(1);
  });

  it("does not replace a stored report when the same id arrives with other content", async () => {
    const reports = memoryReports();
    app = await buildApp({
      logger: false,
      reports,
      accounts: memoryAccounts(),
    });
    const clientId = randomUUID();

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload: { ...reportPayload(clientId), description: "Texto original" },
    });
    const conflict = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload: { ...reportPayload(clientId), description: "Texto distinto" },
    });

    expect(conflict.statusCode).toBe(409);
    expect(conflict.json()).toEqual(toErrorBody(409));
    expect(reports.rows[0]?.description).toBe("Texto original");
  });

  it("attaches saved reports without an owner to the account that opens them", async () => {
    const reports = memoryReports();
    reports.rows.push({
      clientId: randomUUID(),
      remoteId: randomUUID(),
      description: "Pepe",
      technicianLabel: "io",
      latitude: 20.9,
      longitude: -89.6,
      createdAt: "2026-10-29T00:00:00.000Z",
      userId: null,
    });
    app = await buildApp({
      logger: false,
      reports,
      accounts: memoryAccounts(),
    });

    const first = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
    });
    const second = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-luis" },
    });

    expect(first.statusCode).toBe(200);
    expect(
      first
        .json()
        .reports.map((report: { description: string }) => report.description),
    ).toContain("Pepe");
    expect(
      second
        .json()
        .reports.map((report: { description: string }) => report.description),
    ).not.toContain("Pepe");
  });

  it("hides a report that belongs to another account", async () => {
    app = await buildApp({
      logger: false,
      reports: memoryReports(),
      accounts: memoryAccounts(),
    });
    const payload = reportPayload();

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload,
    });
    const foreign = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${payload.clientId}`,
      headers: { cookie: "fs_session=session-luis" },
    });
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-luis" },
    });

    expect(foreign.statusCode).toBe(404);
    expect(list.json()).toEqual({ reports: [] });
  });

  it("returns 503 when storage is not configured", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      payload: reportPayload(),
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual(toErrorBody(503));
  });

  it("returns the stored report by its client id", async () => {
    app = await buildApp({
      logger: false,
      reports: memoryReports(),
      accounts: memoryAccounts(),
    });
    const payload = {
      ...reportPayload(),
      description: "Consulta por identificador",
    };

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload,
    });
    const found = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${payload.clientId}`,
      headers: { cookie: "fs_session=session-ana" },
    });
    const missing = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${randomUUID()}`,
      headers: { cookie: "fs_session=session-ana" },
    });

    expect(found.statusCode).toBe(200);
    expect(found.json()).toMatchObject({
      clientId: payload.clientId,
      description: payload.description,
      latitude: payload.latitude,
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual(toErrorBody(404, "Report not found"));
  });

  it("lists only the reports of the signed-in account", async () => {
    app = await buildApp({
      logger: false,
      reports: memoryReports(),
      accounts: memoryAccounts(),
    });
    const payload = {
      ...reportPayload(),
      description: "Visible en otro dispositivo",
    };

    await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
      payload,
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { cookie: "fs_session=session-ana" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reports: [
        {
          clientId: payload.clientId,
          description: payload.description,
          longitude: payload.longitude,
        },
      ],
    });
  });
});
