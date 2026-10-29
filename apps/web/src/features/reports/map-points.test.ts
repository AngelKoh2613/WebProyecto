import { describe, expect, it } from "vitest";
import type { LocalReport } from "./db";
import {
  buildMapView,
  coordinateCenter,
  reportsWithCoordinates,
} from "./map-points";

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

describe("buildMapView", () => {
  it("places one report on a street-level OpenStreetMap tile", () => {
    const located = reportsWithCoordinates([
      report(20.9365113345709, -89.62881678993716, "Prueba 3"),
    ]);
    const point = located[0];
    if (!point) throw new Error("expected a located report");
    const view = buildMapView([point], { width: 320, height: 384 });

    expect(view.zoom).toBe(16);
    expect(view.tiles.length).toBeGreaterThan(0);
    expect(view.tiles[0]?.url).toMatch(
      /^https:\/\/tile\.openstreetmap\.org\/16\/\d+\/\d+\.png$/,
    );
    expect(view.markers).toEqual([
      expect.objectContaining({
        clientId: point.clientId,
        description: "Prueba 3",
      }),
    ]);
    expect(view.markers[0]?.left).toBeCloseTo(160, 0);
    expect(view.markers[0]?.top).toBeCloseTo(192, 0);
  });

  it("zooms out until two distant reports fit in the frame", () => {
    const points = reportsWithCoordinates([
      report(20.9, -89.6, "Uno"),
      report(21.2, -89.2, "Dos"),
    ]);
    const view = buildMapView(points, { width: 320, height: 384 });

    expect(view.zoom).toBeLessThan(16);
    expect(view.markers).toHaveLength(2);
    for (const marker of view.markers) {
      expect(marker.left).toBeGreaterThan(24);
      expect(marker.left).toBeLessThan(296);
      expect(marker.top).toBeGreaterThan(24);
      expect(marker.top).toBeLessThan(360);
    }
  });
});
