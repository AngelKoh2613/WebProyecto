import { describe, expect, it } from "vitest";
import type { LocalReport } from "./db";
import { coordinateCenter, reportsWithCoordinates } from "./map-points";

function report(
  latitude: number | null,
  longitude: number | null,
  description = "Prueba",
): LocalReport {
  return {
    clientId: "11111111-1111-4111-8111-111111111111",
    userId: null,
    description,
    technicianLabel: null,
    latitude,
    longitude,
    createdAt: "2026-10-29T16:00:00.000Z",
    updatedAt: "2026-10-29T16:00:00.000Z",
    syncStatus: "synced",
    remoteId: null,
    syncedAt: null,
    errorMessage: null,
    attemptCount: 0,
    nextAttemptAt: null,
  };
}

describe("reportsWithCoordinates", () => {
  it("keeps finite coordinates and drops empty or impossible ones", () => {
    const located = reportsWithCoordinates([
      report(20.9365, -89.6288, "Prueba 3"),
      report(null, null, "Sin lugar"),
      report(Number.NaN, -89.6, "Incompleta"),
      report(91, -89.6, "Fuera de rango"),
    ]);

    expect(located.map((item) => item.description)).toEqual(["Prueba 3"]);
  });

  it("centers the view on the saved coordinates", () => {
    expect(
      coordinateCenter(
        reportsWithCoordinates([
          report(20, -90, "Norte"),
          report(22, -88, "Sur"),
        ]),
      ),
    ).toEqual([21, -89]);
  });
});
