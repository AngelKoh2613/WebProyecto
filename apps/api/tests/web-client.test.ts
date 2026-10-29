import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { apiErrorBodySchema } from "@field-service/validation";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/build-app.js";
import { productionWebDist } from "../src/web/client-root.js";
import { isClientNavigation } from "../src/web/register-client.js";

describe("production web path", () => {
  it("resolves the Vite build from the module location, not the working directory", () => {
    const root = path.join("C:\\repo");
    const modulePath = path.join(
      root,
      "apps",
      "api",
      "dist",
      "web",
      "client-root.js",
    );
    const previous = process.cwd();
    process.chdir(tmpdir());

    try {
      expect(productionWebDist(pathToFileURL(modulePath).href)).toBe(
        path.resolve(root, "apps", "web", "dist"),
      );
    } finally {
      process.chdir(previous);
    }
  });
});

describe("client navigation", () => {
  it("keeps API and asset paths out of the HTML fallback", () => {
    expect(isClientNavigation("GET", "/mis-reportes")).toBe(true);
    expect(isClientNavigation("GET", "/")).toBe(true);
    expect(isClientNavigation("GET", "/api/missing")).toBe(false);
    expect(isClientNavigation("GET", "/health/ready")).toBe(false);
    expect(isClientNavigation("GET", "/assets/app.js")).toBe(false);
    expect(isClientNavigation("POST", "/mis-reportes")).toBe(false);
  });
});

describe("compiled client", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("serves the interface, the API, and refuses paths outside the build", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "field-service-web-"));
    const webRoot = path.join(directory, "dist");
    await mkdir(path.join(webRoot, "assets"), { recursive: true });
    await writeFile(
      path.join(webRoot, "index.html"),
      "<!doctype html><title>Field Service</title>",
    );
    await writeFile(path.join(webRoot, "assets", "app.js"), "console.log(1)");
    await writeFile(
      path.join(webRoot, "sw.js"),
      "self.addEventListener('install',()=>{});",
    );
    await writeFile(
      path.join(webRoot, "workbox-abc.js"),
      "self.addEventListener('install',()=>{});",
    );
    await writeFile(
      path.join(webRoot, "assets", "large.js"),
      `console.log(${JSON.stringify("x".repeat(2048))});`,
    );
    await writeFile(path.join(directory, "secret.txt"), "super-secret-value");

    app = await buildApp({ logger: false, webRoot });

    const page = await app.inject({ method: "GET", url: "/" });
    const screen = await app.inject({ method: "GET", url: "/mis-reportes" });
    const asset = await app.inject({ method: "GET", url: "/assets/app.js" });
    const worker = await app.inject({ method: "GET", url: "/sw.js" });
    const workbox = await app.inject({ method: "GET", url: "/workbox-abc.js" });
    const compressed = await app.inject({
      method: "GET",
      url: "/assets/large.js",
      headers: { "accept-encoding": "gzip" },
    });
    const health = await app.inject({ method: "GET", url: "/health" });
    const missingApi = await app.inject({ method: "GET", url: "/api/missing" });
    const missingAsset = await app.inject({
      method: "GET",
      url: "/assets/missing.js",
    });
    const escape = await app.inject({ method: "GET", url: "/../secret.txt" });

    expect(page.statusCode).toBe(200);
    expect(page.headers["content-type"]).toContain("text/html");
    expect(page.body).toContain("Field Service");
    expect(page.headers["cache-control"]).toBe("no-cache");
    expect(screen.statusCode).toBe(200);
    expect(screen.body).toContain("Field Service");
    expect(asset.statusCode).toBe(200);
    expect(asset.body).toContain("console.log(1)");
    expect(asset.headers["cache-control"]).not.toBe("no-cache");
    expect(worker.statusCode).toBe(200);
    expect(worker.headers["cache-control"]).toBe("no-cache");
    expect(workbox.statusCode).toBe(200);
    expect(workbox.headers["cache-control"]).toBe("no-cache");
    expect(compressed.statusCode).toBe(200);
    expect(compressed.headers["content-encoding"]).toBe("gzip");
    expect(health.statusCode).toBe(200);
    expect(health.headers["content-type"]).toContain("application/json");
    expect(missingApi.statusCode).toBe(404);
    expect(missingApi.headers["content-type"]).toContain("application/json");
    expect(apiErrorBodySchema.parse(missingApi.json()).error.code).toBe(
      "NOT_FOUND",
    );
    expect(missingAsset.statusCode).toBe(404);
    expect(missingAsset.headers["content-type"]).toContain("application/json");
    expect(escape.statusCode).not.toBe(200);
    expect(escape.body).not.toContain("super-secret-value");
  });
});
