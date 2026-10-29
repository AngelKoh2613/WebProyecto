import { SESSION_MAX_AGE_SECONDS } from "./password.js";

export const SESSION_COOKIE = "fs_session";

export function sessionCookieHeader(
  token: string,
  secure: boolean,
  maxAge = SESSION_MAX_AGE_SECONDS,
): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  return sessionCookieHeader("", secure, 0);
}

export function readSessionToken(
  cookieHeader: string | undefined,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    return value || null;
  }
  return null;
}
