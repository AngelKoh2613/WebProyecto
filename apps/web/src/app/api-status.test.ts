import { describe, expect, it, vi } from "vitest";
import { readApiStatus } from "./api-status";

describe("readApiStatus", () => {
  it("asks the health and readiness endpoints under the given base URL", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (String(input).endsWith("/health/ready")) {
        return jsonResponse(
          { status: "not_ready", checks: { database: "down" } },
          503,
        );
      }

      return jsonResponse({ status: "ok", service: "field-service-api" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(readApiStatus("http://127.0.0.1:3000")).resolves.toEqual({
      api: "up",
      database: "down",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:3000/health",
      {
        cache: "no-store",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:3000/health/ready",
      { cache: "no-store" },
    );

    vi.unstubAllGlobals();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
