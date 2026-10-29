import { describe, expect, it } from "vitest";
import {
  MAX_RETRY_MS,
  isRetryableHttpStatus,
  retryDelayMs,
} from "./sync-policy";

describe("retry policy", () => {
  it("waits longer after each attempt and then stops growing", () => {
    expect(retryDelayMs(1)).toBe(2_000);
    expect(retryDelayMs(2)).toBe(4_000);
    expect(retryDelayMs(3)).toBe(8_000);
    expect(retryDelayMs(20)).toBe(MAX_RETRY_MS);
  });

  it("retries only temporary HTTP failures", () => {
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(409)).toBe(false);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });
});
