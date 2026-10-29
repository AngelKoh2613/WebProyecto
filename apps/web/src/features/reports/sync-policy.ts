export const MAX_SYNC_ATTEMPTS = 5;
export const BASE_RETRY_MS = 2_000;
export const MAX_RETRY_MS = 5 * 60 * 1000;

export function retryDelayMs(attemptCount: number): number {
  const exponent = Math.max(0, attemptCount - 1);
  return Math.min(MAX_RETRY_MS, BASE_RETRY_MS * 2 ** exponent);
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
