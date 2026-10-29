import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

const REQUESTS_PER_MINUTE = 300;

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  await app.register(helmet);
  await app.register(rateLimit, {
    max: REQUESTS_PER_MINUTE,
    timeWindow: "1 minute",
  });
}
