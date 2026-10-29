import type { FastifyRequest } from "fastify";
import type { AccountRepository, AccountUser } from "./repository.js";
import { readSessionToken } from "./cookie.js";

export async function readRequestUser(
  request: FastifyRequest,
  accounts?: AccountRepository,
): Promise<AccountUser | null> {
  if (!accounts) return null;
  const header = request.headers.cookie;
  const token = readSessionToken(
    typeof header === "string" ? header : undefined,
  );
  if (!token) return null;
  return accounts.readSession(token);
}

export function requestUsesSecureCookie(
  request: FastifyRequest,
  production: boolean,
): boolean {
  if (request.protocol === "https") return true;
  if (!production) return false;
  const host = request.headers.host?.split(":")[0]?.toLowerCase() ?? "";
  return host !== "127.0.0.1" && host !== "localhost" && host !== "[::1]";
}
