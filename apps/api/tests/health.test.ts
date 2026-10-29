import {
  apiErrorBodySchema,
  apiIndexResponseSchema,
  healthResponseSchema,
  readinessResponseSchema,
} from "@field-service/validation";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { DatabaseProbe } from "../src/db/client.js";
import { buildApp } from "../src/app/build-app.js";
import { statusCodeOf, toErrorBody } from "../src/shared/http-errors.js";

const downDatabase: DatabaseProbe = {
  async ping() {
    throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
  },
  async close() {},
};

const upDatabase: DatabaseProbe = {
  async ping() {},
  async close() {},
};

describe("HTTP smoke", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("reports the API service on GET /health", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "ok",
      service: "field-service-api",
    });
  });

  it("reports not ready when PostgreSQL is not configured", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({ method: "GET", url: "/health/ready" });

    expect(response.statusCode).toBe(503);
    expect(readinessResponseSchema.parse(response.json())).toEqual({
      status: "not_ready",
      checks: { database: "not_configured" },
    });
  });

  it("reports not ready when the database probe fails, without leaking the cause", async () => {
    app = await buildApp({ logger: false, database: downDatabase });

    const response = await app.inject({ method: "GET", url: "/health/ready" });

    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain("ECONNREFUSED");
    expect(readinessResponseSchema.parse(response.json())).toEqual({
      status: "not_ready",
      checks: { database: "down" },
    });
  });

  it("reports ready when the database probe succeeds", async () => {
    app = await buildApp({ logger: false, database: upDatabase });

    const response = await app.inject({ method: "GET", url: "/health/ready" });

    expect(response.statusCode).toBe(200);
    expect(readinessResponseSchema.parse(response.json())).toEqual({
      status: "ready",
      checks: { database: "up" },
    });
  });

  it("identifies the initial API at GET /api/v1", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({ method: "GET", url: "/api/v1" });

    expect(response.statusCode).toBe(200);
    expect(apiIndexResponseSchema.parse(response.json())).toEqual({
      service: "field-service-api",
      version: "v1",
      status: "initial",
    });
  });

  it("allows only the configured browser origin", async () => {
    app = await buildApp({
      logger: false,
      corsOrigin: "http://127.0.0.1:5173",
    });

    const allowed = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://127.0.0.1:5173" },
    });
    const rejected = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://evil.example" },
    });

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://127.0.0.1:5173",
    );
    expect(rejected.headers["access-control-allow-origin"]).not.toBe(
      "https://evil.example",
    );
  });

  it("leaves CORS disabled when no origin is configured", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://127.0.0.1:5173" },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("uses only an HTTP error status and hides other failures", () => {
    expect(statusCodeOf({ statusCode: 429 })).toBe(429);
    expect(statusCodeOf({ statusCode: 200 })).toBe(500);
    expect(statusCodeOf(new Error("database password"))).toBe(500);
  });

  it("returns the shared error body for an unknown route", async () => {
    app = await buildApp({ logger: false });

    const response = await app.inject({ method: "GET", url: "/missing" });

    expect(response.statusCode).toBe(404);
    expect(apiErrorBodySchema.parse(response.json())).toEqual(toErrorBody(404));
  });
});
