import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

describe("loadEnv", () => {
  it("applies local defaults when the environment is empty", () => {
    expect(loadEnv({})).toEqual({
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: 3000,
      LOG_LEVEL: "info",
    });
  });

  it("ignores the local API host when Render sets production", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      API_HOST: "127.0.0.1",
      API_PORT: "3000",
      HOST: "0.0.0.0",
      PORT: "10000",
    });

    expect(env.HOST).toBe("0.0.0.0");
    expect(env.PORT).toBe(10000);
  });

  it("listens on all interfaces in production when the platform host is absent", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      API_HOST: "127.0.0.1",
      API_PORT: "3000",
    });

    expect(env.HOST).toBe("0.0.0.0");
    expect(env.PORT).toBe(3000);
  });

  it("prefers API_HOST and API_PORT over the earlier names", () => {
    const env = loadEnv({
      API_HOST: "0.0.0.0",
      HOST: "127.0.0.1",
      API_PORT: "4000",
      PORT: "3001",
    });

    expect(env.HOST).toBe("0.0.0.0");
    expect(env.PORT).toBe(4000);
  });

  it("keeps a database URL without requiring a connection", () => {
    const env = loadEnv({
      DATABASE_URL:
        "postgresql://USER:PASSWORD@127.0.0.1:5432/field_service_dev",
    });

    expect(env.DATABASE_URL).toBe(
      "postgresql://USER:PASSWORD@127.0.0.1:5432/field_service_dev",
    );
  });

  it("rejects a port outside the TCP range", () => {
    expect(() => loadEnv({ PORT: "70000" })).toThrow(
      "Invalid environment: PORT",
    );
  });

  it("rejects an invalid database URL without echoing the value", () => {
    const secret = "super-secret-value";

    expect(() => loadEnv({ DATABASE_URL: secret })).toThrow(
      "Invalid environment: DATABASE_URL",
    );
    try {
      loadEnv({ DATABASE_URL: secret });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error ? error.message : "").not.toContain(secret);
    }
  });

  it("rejects a wildcard CORS origin", () => {
    expect(() => loadEnv({ CORS_ORIGIN: "*" })).toThrow(
      "Invalid environment: CORS_ORIGIN",
    );
  });

  it("ignores blank values", () => {
    expect(loadEnv({ HOST: "", PORT: "", CORS_ORIGIN: "" }).HOST).toBe(
      "127.0.0.1",
    );
    expect(loadEnv({ HOST: "", PORT: "" }).PORT).toBe(3000);
  });
});
