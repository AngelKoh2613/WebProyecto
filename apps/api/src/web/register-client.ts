import path from "node:path";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import { toErrorBody } from "../shared/http-errors.js";

export function isClientNavigation(method: string, url: string): boolean {
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  const pathname = url.split("?")[0] ?? url;
  if (pathname === "/health" || pathname.startsWith("/health/")) {
    return false;
  }
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return false;
  }

  const leaf = pathname.split("/").pop() ?? "";
  return !leaf.includes(".");
}

export async function registerWebClient(
  app: FastifyInstance,
  root: string,
): Promise<void> {
  await app.register(fastifyStatic, {
    root,
    index: ["index.html"],
    dotfiles: "deny",
    serveDotFiles: false,
  });

  app.setNotFoundHandler((request, reply) => {
    if (!isClientNavigation(request.method, request.url)) {
      return reply.code(404).send(toErrorBody(404));
    }

    return reply.sendFile("index.html", { maxAge: 0, immutable: false });
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    const filePath =
      typeof payload === "object" &&
      payload !== null &&
      "path" in payload &&
      typeof payload.path === "string"
        ? payload.path
        : "";
    if (path.basename(filePath) === "index.html") {
      reply.header("cache-control", "no-cache");
    }
    return payload;
  });
}
