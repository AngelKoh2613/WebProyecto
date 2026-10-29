export const API_SERVICE_NAME = "field-service-api" as const;

export const API_VERSION = "v1" as const;

export interface HealthResponse {
  status: "ok";
  service: typeof API_SERVICE_NAME;
}

export type DatabaseCheckStatus = "up" | "down" | "not_configured";

export interface ReadinessResponse {
  status: "ready" | "not_ready";
  checks: {
    database: DatabaseCheckStatus;
  };
}

export interface ApiIndexResponse {
  service: typeof API_SERVICE_NAME;
  version: typeof API_VERSION;
  status: "initial";
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface CreateServiceReportRequest {
  clientId: string;
  description: string;
  technicianLabel?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface ServiceReportRecord {
  clientId: string;
  remoteId: string;
  description: string;
  technicianLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
}

export interface ServiceReportSyncResponse extends ServiceReportRecord {
  outcome: "created" | "existing";
}

export interface ServiceReportListResponse {
  reports: ServiceReportRecord[];
}
