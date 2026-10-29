import type { ApiErrorBody } from "@field-service/contracts";

export function statusCodeOf(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  ) {
    return error.statusCode;
  }

  return 500;
}

export function toErrorBody(
  statusCode: number,
  message?: string,
): ApiErrorBody {
  if (statusCode === 400) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request could not be processed",
      },
    };
  }

  if (statusCode === 401) {
    return {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
  }

  if (statusCode === 404) {
    return {
      error: {
        code: "NOT_FOUND",
        message: message ?? "Route not found",
      },
    };
  }

  if (statusCode === 409) {
    return {
      error: {
        code: "CONFLICT",
        message: message ?? "The report already exists with different content",
      },
    };
  }

  if (statusCode === 503) {
    return {
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable",
      },
    };
  }

  if (statusCode >= 500) {
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    };
  }

  return {
    error: {
      code: "REQUEST_ERROR",
      message: "Request could not be processed",
    },
  };
}
