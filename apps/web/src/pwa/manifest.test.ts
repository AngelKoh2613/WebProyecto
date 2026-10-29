import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { precachedPublicAssets, serviceWorkerPlan } from "./workbox-options";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("manifiesto de instalación", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(webRoot, "public/manifest.webmanifest"), "utf8"),
  ) as {
    name: string;
    short_name: string;
    description: string;
    start_url: string;
    scope: string;
    display: string;
    background_color: string;
    theme_color: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };

  it("declara la identidad, el alcance y el modo standalone", () => {
    expect(manifest.name).toBe("Field Service");
    expect(manifest.short_name.length).toBeGreaterThan(0);
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("referencia iconos PNG de 192 y 512, incluidos los maskable", () => {
    const byPurpose = (purpose: string) =>
      manifest.icons.filter((icon) => icon.purpose === purpose);

    expect(byPurpose("any").map((icon) => icon.sizes)).toEqual([
      "192x192",
      "512x512",
    ]);
    expect(byPurpose("maskable").map((icon) => icon.sizes)).toEqual([
      "192x192",
      "512x512",
    ]);

    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
      const file = readFileSync(path.join(webRoot, "public", icon.src));
      expect(file.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(file.readUInt32BE(16)).toBe(Number(icon.sizes.split("x")[0]));
      expect(file.readUInt32BE(20)).toBe(Number(icon.sizes.split("x")[1]));
    }
  });

  it("está enlazado desde el HTML junto al color del tema", () => {
    const html = readFileSync(path.join(webRoot, "index.html"), "utf8");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('href="/manifest.webmanifest"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('content="#2563eb"');
  });
});

describe("plan del Service Worker", () => {
  it("precacha el manifiesto y los iconos, y deja la API fuera de la caché", () => {
    expect(serviceWorkerPlan.registerType).toBe("prompt");
    expect(serviceWorkerPlan.navigateFallback).toBe("/index.html");
    expect(serviceWorkerPlan.cleanupOutdatedCaches).toBe(true);
    expect(serviceWorkerPlan.skipWaiting).toBe(false);
    expect(serviceWorkerPlan.runtimeCaching).toEqual([]);
    expect(
      serviceWorkerPlan.navigateFallbackDenylist.some((pattern) =>
        pattern.test("/api/v1"),
      ),
    ).toBe(true);
    expect(
      serviceWorkerPlan.navigateFallbackDenylist.some((pattern) =>
        pattern.test("/health/ready"),
      ),
    ).toBe(true);
    expect(
      serviceWorkerPlan.navigateFallbackDenylist.some((pattern) =>
        pattern.test("/mis-reportes"),
      ),
    ).toBe(false);
    expect(precachedPublicAssets).toContain("manifest.webmanifest");
    expect(precachedPublicAssets).toContain("icons/icon-192.png");
    expect(precachedPublicAssets).toContain("icons/icon-512.png");
  });
});
