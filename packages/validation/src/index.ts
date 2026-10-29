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
  createdAt: z.iso.datetime(),
});

export const serviceReportRecordSchema = z.object({
  clientId: z.uuid(),
  remoteId: z.uuid(),
  description: z.string().min(1).max(2000),
  technicianLabel: z.string().min(1).max(80).nullable(),
  createdAt: z.iso.datetime(),
});

export const serviceReportSyncResponseSchema = serviceReportRecordSchema.extend(
  {
    outcome: z.enum(["created", "existing"]),
  },
);
