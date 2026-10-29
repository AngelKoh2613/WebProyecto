import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LocalReport } from "./db";
import { ReportMap } from "./ReportMap";

function report(
  latitude: number | null,
  longitude: number | null,
  description: string,
  clientId = "33333333-3333-4333-8333-333333333333",
): LocalReport {
  return {
    clientId,
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
  it("shows OpenStreetMap tiles and a pin for each saved coordinate", () => {
    const onOpenReport = vi.fn();
    const { container } = render(
      <ReportMap
        reports={[
          report(20.9365113345709, -89.62881678993716, "Prueba 3"),
          report(
            null,
            -89.6,
            "Sin latitud",
            "44444444-4444-4444-8444-444444444444",
          ),
        ]}
        onOpenReport={onOpenReport}
      />,
    );

    const images = [...container.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    expect(
      images.every((image) =>
        image
          .getAttribute("src")
          ?.startsWith("https://tile.openstreetmap.org/"),
      ),
    ).toBe(true);
    expect(
      screen.getByRole("region", { name: "Mapa de reportes" }),
    ).toHaveStyle({ height: "24rem" });

    fireEvent.click(screen.getByRole("button", { name: "Prueba 3" }));
    expect(onOpenReport).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-333333333333",
    );
    expect(
      screen.queryByRole("button", { name: "Sin latitud" }),
    ).not.toBeInTheDocument();
  });

  it("says when no report has coordinates", () => {
    render(
      <ReportMap
        reports={[report(null, null, "Sin lugar")]}
        onOpenReport={() => undefined}
      />,
    );

    expect(
      screen.getByText("No hay coordenadas para mostrar en el mapa."),
    ).toBeInTheDocument();
  });
});
