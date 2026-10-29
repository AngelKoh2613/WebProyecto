import { accountProfileSchema } from "@field-service/validation";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/build-app.js";
import type { AccountRepository, AccountUser } from "../src/auth/repository.js";
import { toErrorBody } from "../src/shared/http-errors.js";

function memoryAccounts(): AccountRepository {
  const users: Array<AccountUser & { password: string }> = [];
  const sessions = new Map<string, string>();
  return {
    async register(input) {
      const email = input.email.toLowerCase();
      if (users.some((user) => user.email === email)) return "exists";
      const user = {
        id: crypto.randomUUID(),
        name: input.name,
        email,
        password: input.password,
      };
      users.push(user);
      return { id: user.id, name: user.name, email: user.email };
    },
    async authenticate(email, password) {
      const user = users.find(
        (item) =>
          item.email === email.toLowerCase() && item.password === password,
      );
      return user ? { id: user.id, name: user.name, email: user.email } : null;
    },
    async createSession(userId) {
      const token = crypto.randomUUID();
      sessions.set(token, userId);
      return { token, expiresAt: new Date(Date.now() + 60_000) };
    },
    async readSession(token) {
      const userId = sessions.get(token);
      const user = users.find((item) => item.id === userId);
      return user ? { id: user.id, name: user.name, email: user.email } : null;
    },
    async deleteSession(token) {
      sessions.delete(token);
    },
  };
}

function cookieOf(response: { headers: Record<string, unknown> }): string {
  const header = response.headers["set-cookie"];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value).split(";")[0] ?? "";
}

describe("account routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("creates an account, keeps the session in a cookie and rejects a bad password", async () => {
    app = await buildApp({ logger: false, accounts: memoryAccounts() });
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        name: "Ana Ruiz",
        email: "Ana@Example.test",
        password: "password12",
      },
    });
    const cookie = cookieOf(created);
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie },
    });
    const rejected = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "ana@example.test", password: "no-es-esta" },
    });

    expect(created.statusCode).toBe(201);
    expect(cookie.startsWith("fs_session=")).toBe(true);
    expect(String(created.headers["set-cookie"])).toContain("HttpOnly");
    expect(String(created.headers["set-cookie"])).not.toContain("Secure");
    expect(created.json()).not.toHaveProperty("password");
    expect(accountProfileSchema.parse(me.json()).email).toBe(
      "ana@example.test",
    );
    expect(rejected.statusCode).toBe(401);
    expect(rejected.json()).toEqual(toErrorBody(401));
  });

  it("refuses a second account with the same email", async () => {
    app = await buildApp({ logger: false, accounts: memoryAccounts() });
    const payload = {
      name: "Ana Ruiz",
      email: "ana@example.test",
      password: "password12",
    };
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload,
    });
    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload,
    });

    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toEqual(
      toErrorBody(409, "An account with this email already exists"),
    );
  });
});
