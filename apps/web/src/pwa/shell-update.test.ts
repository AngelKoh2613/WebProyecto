import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldTakeWaitingWorker, watchAppForeground } from "./shell-update";

describe("shell update", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("takes a waiting worker only when this page is already controlled", () => {
    expect(
      shouldTakeWaitingWorker({
        controlled: true,
        waiting: true,
        applying: false,
      }),
    ).toBe(true);
    expect(
      shouldTakeWaitingWorker({
        controlled: false,
        waiting: true,
        applying: false,
      }),
    ).toBe(false);
    expect(
      shouldTakeWaitingWorker({
        controlled: true,
        waiting: true,
        applying: true,
      }),
    ).toBe(false);
    expect(
      shouldTakeWaitingWorker({
        controlled: true,
        waiting: false,
        applying: false,
      }),
    ).toBe(false);
  });

  it("checks again when the phone opens the installed app", () => {
    const check = vi.fn();
    const stop = watchAppForeground(check);

    window.dispatchEvent(new Event("pageshow"));
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));

    expect(check).toHaveBeenCalledTimes(3);
    stop();
    window.dispatchEvent(new Event("pageshow"));
    expect(check).toHaveBeenCalledTimes(3);
  });
});
