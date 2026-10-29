import {
  healthResponseSchema,
  readinessResponseSchema,
} from "@field-service/validation";

export type DatabaseStatus =
  "up" | "down" | "not_configured" | "unknown" | "unchecked";

export type ApiStatus =
  | { api: "checking" }
  | { api: "unreachable" }
  | { api: "up"; database: DatabaseStatus };

const configuredBaseUrl = import.meta.env.VITE_API_URL;

export const apiBaseUrl =
  typeof configuredBaseUrl === "string"
    ? configuredBaseUrl.replace(/\/$/, "")
    : "";

export async function readApiStatus(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<Exclude<ApiStatus, { api: "checking" }>> {
  const root = baseUrl.replace(/\/$/, "");

  try {
    const healthResponse = await fetch(`${root}/health`, {
      cache: "no-store",
      ...(signal ? { signal } : {}),
    });
    if (!healthResponse.ok) {
      return { api: "unreachable" };
    }

    const health = healthResponseSchema.safeParse(await healthResponse.json());
    if (!health.success) {
      return { api: "unreachable" };
    }

    const readyResponse = await fetch(`${root}/health/ready`, {
      cache: "no-store",
      ...(signal ? { signal } : {}),
    });
    const ready = readinessResponseSchema.safeParse(await readyResponse.json());
    if (!ready.success) {
      return { api: "up", database: "unknown" };
    }

    return { api: "up", database: ready.data.checks.database };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    return { api: "unreachable" };
  }
}
