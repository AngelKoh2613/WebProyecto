import { describe, expect, it } from "vitest";
import { offersIosInstall } from "./ios-install";

describe("offersIosInstall", () => {
  it("offers the home-screen steps on an iPhone that is not installed", () => {
    expect(
      offersIosInstall({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toBe(true);
  });

  it("stays hidden after the site is already on the home screen", () => {
    expect(
      offersIosInstall({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
        standalone: true,
      }),
    ).toBe(false);
  });

  it("does not offer those steps on a desktop browser", () => {
    expect(
      offersIosInstall({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        platform: "Win32",
        maxTouchPoints: 0,
        standalone: false,
      }),
    ).toBe(false);
  });
});
