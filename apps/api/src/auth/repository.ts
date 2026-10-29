import { and, eq, gt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { sessions, users } from "../db/schema.js";
import {
  hashPassword,
  hashSessionToken,
  newSessionToken,
  sessionExpiresAt,
  verifyPassword,
} from "./password.js";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}

export interface AccountRepository {
  register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AccountUser | "exists">;
  authenticate(email: string, password: string): Promise<AccountUser | null>;
  createSession(userId: string): Promise<{ token: string; expiresAt: Date }>;
  readSession(token: string): Promise<AccountUser | null>;
  deleteSession(token: string): Promise<void>;
}

export function createAccountRepository(
  db: NodePgDatabase<typeof schema>,
): AccountRepository {
  return {
    async register(input) {
      const email = input.email.toLowerCase();
      try {
        const inserted = await db
          .insert(users)
          .values({
            name: input.name,
            email,
            passwordHash: await hashPassword(input.password),
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
          });
        const user = inserted[0];
        if (!user) return "exists";
        return user;
      } catch (error) {
        if (isUniqueViolation(error)) return "exists";
        throw error;
      }
    },

    async authenticate(email, password) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      const user = rows[0];
      if (!user) return null;
      const matches = await verifyPassword(password, user.passwordHash);
      if (!matches) return null;
      return { id: user.id, name: user.name, email: user.email };
    },

    async createSession(userId) {
      const token = newSessionToken();
      const expiresAt = sessionExpiresAt();
      await db.insert(sessions).values({
        userId,
        tokenHash: hashSessionToken(token),
        expiresAt,
      });
      return { token, expiresAt };
    },

    async readSession(token) {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(
            eq(sessions.tokenHash, hashSessionToken(token)),
            gt(sessions.expiresAt, new Date()),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },

    async deleteSession(token) {
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, hashSessionToken(token)));
    },
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  if ("cause" in error) return isUniqueViolation(error.cause);
  return false;
}
