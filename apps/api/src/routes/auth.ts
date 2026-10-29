import type { AccountProfile } from "@field-service/contracts";
import {
  loginAccountSchema,
  registerAccountSchema,
} from "@field-service/validation";
import type { FastifyInstance } from "fastify";
import {
  clearSessionCookie,
  readSessionToken,
  sessionCookieHeader,
} from "../auth/cookie.js";
import type { AccountRepository } from "../auth/repository.js";
import { requestUsesSecureCookie } from "../auth/request-user.js";
import { toErrorBody } from "../shared/http-errors.js";

const authLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};

export async function registerAuthRoutes(
  app: FastifyInstance,
  options: { accounts?: AccountRepository; production?: boolean } = {},
): Promise<void> {
  const { accounts, production = false } = options;

  app.post("/api/v1/auth/register", authLimit, async (request, reply) => {
    const parsed = registerAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(toErrorBody(400));
    }
    if (!accounts) {
      return reply.code(503).send(toErrorBody(503));
    }

    const user = await accounts.register(parsed.data);
    if (user === "exists") {
      return reply
        .code(409)
        .send(toErrorBody(409, "An account with this email already exists"));
    }

    const session = await accounts.createSession(user.id);
    reply.header(
      "set-cookie",
      sessionCookieHeader(
        session.token,
        requestUsesSecureCookie(request, production),
      ),
    );
    const body: AccountProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    return reply.code(201).send(body);
  });

  app.post("/api/v1/auth/login", authLimit, async (request, reply) => {
    const parsed = loginAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(toErrorBody(400));
    }
    if (!accounts) {
      return reply.code(503).send(toErrorBody(503));
    }

    const user = await accounts.authenticate(
      parsed.data.email,
      parsed.data.password,
    );
    if (!user) {
      return reply.code(401).send(toErrorBody(401));
    }

    const session = await accounts.createSession(user.id);
    reply.header(
      "set-cookie",
      sessionCookieHeader(
        session.token,
        requestUsesSecureCookie(request, production),
      ),
    );
    const body: AccountProfile = user;
    return body;
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    if (accounts) {
      const token = readSessionToken(
        typeof request.headers.cookie === "string"
          ? request.headers.cookie
          : undefined,
      );
      if (token) await accounts.deleteSession(token);
    }
    reply.header(
      "set-cookie",
      clearSessionCookie(requestUsesSecureCookie(request, production)),
    );
    return reply.code(204).send();
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    if (!accounts) {
      return reply.code(503).send(toErrorBody(503));
    }
    const token = readSessionToken(
      typeof request.headers.cookie === "string"
        ? request.headers.cookie
        : undefined,
    );
    const user = token ? await accounts.readSession(token) : null;
    if (!user) {
      return reply.code(401).send(toErrorBody(401));
    }
    return user;
  });
}
