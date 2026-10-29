import * as z from "zod";

const nodeEnv = z.enum(["development", "test", "production"]);
const logLevel = z.enum([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
]);

const envSchema = z.object({
  NODE_ENV: nodeEnv.default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: logLevel.default("info"),
  DATABASE_URL: z
    .string()
    .refine((value) => /^postgres(ql)?:\/\//.test(value))
    .optional(),
  CORS_ORIGIN: z
    .string()
    .refine((value) => value !== "*" && /^https?:\/\/[^\s/]+$/.test(value))
    .optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

function firstNonEmpty(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const defined: Record<string, string> = {};
  const nodeEnvironment = firstNonEmpty(source.NODE_ENV);
  const production = nodeEnvironment === "production";
  const host = production
    ? (firstNonEmpty(source.HOST) ?? "0.0.0.0")
    : firstNonEmpty(source.API_HOST, source.HOST);
  const port = production
    ? (firstNonEmpty(source.PORT) ?? "3000")
    : firstNonEmpty(source.API_PORT, source.PORT);
  const level = firstNonEmpty(source.LOG_LEVEL);
  const databaseUrl = firstNonEmpty(source.DATABASE_URL);
  const corsOrigin = firstNonEmpty(source.CORS_ORIGIN);

  if (nodeEnvironment) defined.NODE_ENV = nodeEnvironment;
  if (host) defined.HOST = host;
  if (port) defined.PORT = port;
  if (level) defined.LOG_LEVEL = level;
  if (databaseUrl) defined.DATABASE_URL = databaseUrl;
  if (corsOrigin) defined.CORS_ORIGIN = corsOrigin;

  const parsed = envSchema.safeParse(defined);
  if (!parsed.success) {
    const names = [
      ...new Set(
        parsed.error.issues.map((issue) =>
          String(issue.path[0] ?? "environment"),
        ),
      ),
    ];
    throw new Error(`Invalid environment: ${names.join(", ")}`);
  }

  return parsed.data;
}
