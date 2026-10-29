import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LocalReport } from "./db";
import { ReportsScreen } from "./ReportsScreen";

const pending: LocalReport = {
  clientId: "11111111-1111-4111-8111-111111111111",
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  description: "La bomba no arranca",
  technicianLabel: null,
  latitude: 19.4326,
  longitude: -99.1332,
  createdAt: "2026-10-27T18:00:00.000Z",
  updatedAt: "2026-10-27T18:00:00.000Z",
  syncStatus: "pending",
  remoteId: null,
  syncedAt: null,
  errorMessage: null,
  attemptCount: 0,
  nextAttemptAt: null,
};

describe("ReportsScreen", () => {
  it("asks for a description before saving", () => {
    const onSave = vi.fn();
    render(
      <ReportsScreen
        reports={[]}
        storageError={null}
        notice={null}
        syncing={false}
        composing
        onComposingChange={() => undefined}
        onSave={onSave}
        onRetry={async () => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar reporte" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribe la descripción del servicio.",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the sync state and keeps the error text with the report", () => {
    render(
      <ReportsScreen
        reports={[
          {
            ...pending,
            syncStatus: "error",
            errorMessage:
              "No hubo respuesta del servidor. El reporte sigue en este dispositivo.",
          },
        ]}
        storageError={null}
        notice="El reporte quedó guardado en este dispositivo."
        syncing={false}
        composing={false}
        onComposingChange={() => undefined}
        onSave={async () => undefined}
        onRetry={async () => undefined}
      />,
    );

    expect(screen.getByText("Error de sincronización")).toBeInTheDocument();
    expect(screen.getByText(/sigue en este dispositivo/i)).toBeInTheDocument();
    expect(
      screen.getByText("El reporte quedó guardado en este dispositivo."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/enviado al servidor/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(screen.getByText("Detalle del reporte")).toBeInTheDocument();
  });
});
