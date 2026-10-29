import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalReport } from "./db";
import { REPORT_MAP_TILES } from "./map-points";
import { ReportMap } from "./ReportMap";

const map = {
  setView: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  getSize: vi.fn(() => ({ x: 360, y: 384 })),
  remove: vi.fn(),
  whenReady: vi.fn((callback: () => void) => {
    callback();
    return map;
  }),
};
const tiles = {
  addTo: vi.fn(() => tiles),
  on: vi.fn(() => tiles),
};
const marker = {
  addTo: vi.fn(() => marker),
  on: vi.fn(() => marker),
  bindTooltip: vi.fn(() => marker),
  getLatLng: vi.fn(() => ({ lat: 20.9365, lng: -89.6288 })),
};

vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => tiles),
    circleMarker: vi.fn(() => marker),
    latLngBounds: vi.fn((points: unknown) => points),
  },
}));

function report(
  latitude: number | null,
  longitude: number | null,
  description: string,
): LocalReport {
  return {
    clientId:
      description === "Prueba 3"
        ? "33333333-3333-4333-8333-333333333333"
        : "44444444-4444-4444-8444-444444444444",
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

describe("ReportMap", () => {
  beforeEach(() => {
    map.setView.mockClear();
    map.fitBounds.mockClear();
    map.invalidateSize.mockClear();
    map.remove.mockClear();
    tiles.addTo.mockClear();
    tiles.on.mockClear();
    marker.addTo.mockClear();
    marker.bindTooltip.mockClear();
  });

  it("draws OpenStreetMap tiles and a point for each saved coordinate", async () => {
    const { default: leaflet } = await import("leaflet");

    render(
      <ReportMap
        reports={[
          report(20.9365, -89.6288, "Prueba 3"),
          report(null, -89.6, "Sin latitud"),
        ]}
        onOpenReport={() => undefined}
      />,
    );

    expect(screen.getByRole("region", { name: "Mapa de reportes" })).toHaveStyle(
      { height: "24rem" },
    );

    await waitFor(() => {
      expect(leaflet.tileLayer).toHaveBeenCalledWith(
        REPORT_MAP_TILES,
        expect.objectContaining({ maxZoom: 19 }),
      );
    });
    expect(leaflet.circleMarker).toHaveBeenCalledTimes(1);
    expect(leaflet.circleMarker).toHaveBeenCalledWith(
      [20.9365, -89.6288],
      expect.any(Object),
    );
    expect(marker.bindTooltip).toHaveBeenCalledWith(
      "Prueba 3",
      expect.objectContaining({ permanent: true }),
    );
    expect(map.setView).toHaveBeenCalledWith([20.9365, -89.6288], 15);
    expect(map.invalidateSize).toHaveBeenCalled();
  });
});
