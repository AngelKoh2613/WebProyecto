import { API_SERVICE_NAME, API_VERSION } from "@field-service/contracts";
import * as z from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal(API_SERVICE_NAME),
});

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.object({
    database: z.enum(["up", "down", "not_configured"]),
  }),
});

export const apiIndexResponseSchema = z.object({
  service: z.literal(API_SERVICE_NAME),
  version: z.literal(API_VERSION),
  status: z.literal("initial"),
});

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

export const registerAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
});

export const loginAccountSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const accountProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  email: emailSchema,
});

export const createServiceReportSchema = z.object({
  clientId: z.uuid(),
  description: z.string().trim().min(1).max(2000),
  technicianLabel: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  createdAt: z.iso.datetime(),
});

export const serviceReportRecordSchema = z.object({
  clientId: z.uuid(),
  remoteId: z.uuid(),
  description: z.string().min(1).max(2000),
  technicianLabel: z.string().min(1).max(80).nullable(),
  latitude: z.number().gte(-90).lte(90).nullable(),
  longitude: z.number().gte(-180).lte(180).nullable(),
  createdAt: z.iso.datetime(),
});

export const serviceReportSyncResponseSchema = serviceReportRecordSchema.extend(
  {
    outcome: z.enum(["created", "existing"]),
  },
);

export const serviceReportListSchema = z.object({
  reports: z.array(serviceReportRecordSchema),
});
