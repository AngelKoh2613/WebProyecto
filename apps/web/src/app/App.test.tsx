import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveLocalAccount } from "../features/auth/local-account";
import { fieldServiceDatabase } from "../features/reports/db";
import {
  markShellReady,
  markUpdateAvailable,
  resetShellStatus,
} from "../pwa/shell-status";
import { App } from "./App";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("App", () => {
  beforeEach(async () => {
    const db = fieldServiceDatabase();
    await db.reports.clear();
    await db.account.clear();
    await saveLocalAccount(db, {
      userId: accountId,
      name: "Técnico",
      email: "tecnico@example.test",
    });
  });

  afterEach(() => {
    cleanup();
    resetShellStatus();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("separa la red del servidor y explica que el reporte queda en el dispositivo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Bienvenido, Técnico" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Field Service")).toBeInTheDocument();
    expect(screen.getByText("Reportes de hoy")).toBeInTheDocument();
    expect(
      await screen.findByText("El servidor no responde"),
    ).toBeInTheDocument();
    expect(screen.getByText("En línea")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Instalar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("La interfaz puede abrirse sin conexión."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Reportes guardados en el dispositivo/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/se guardan en este dispositivo/i).length,
    ).toBeGreaterThan(0);
  });

  it("avisa sin conexión y la copia local solo cuando el shell está listo", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<App />);

    expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
    expect(
      screen.getByText(/Los datos del servidor no están disponibles/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("La interfaz puede abrirse sin conexión."),
    ).not.toBeInTheDocument();

    act(() => {
      markShellReady();
    });

    expect(
      screen.getByText("La interfaz puede abrirse sin conexión."),
    ).toBeInTheDocument();
  });

  it("muestra la actualización y la instalación solo cuando el navegador las ofrece", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const apply = vi.fn().mockResolvedValue(undefined);
    const prompt = vi.fn().mockResolvedValue(undefined);

    render(<App />);
    await screen.findByRole("heading", { name: "Bienvenido, Técnico" });
    act(() => {
      markUpdateAvailable(apply);
    });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(screen.getByText("Actualización disponible")).toBeInTheDocument();
    expect(apply).toHaveBeenCalledOnce();

    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, { prompt });
    act(() => {
      window.dispatchEvent(event);
    });
    fireEvent.click(screen.getByRole("button", { name: "Instalar" }));

    expect(prompt).toHaveBeenCalledOnce();
  });

  it("marca la base de datos aparte de la conexión del navegador", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        if (String(input).endsWith("/health/ready")) {
          return jsonResponse({
            status: "ready",
            checks: { database: "up" },
          });
        }

        return jsonResponse({
          status: "ok",
          service: "field-service-api",
        });
      }),
    );

    render(<App />);

    expect(await screen.findByText("En línea")).toBeInTheDocument();
    expect(screen.getByText("Base de datos disponible")).toBeInTheDocument();
  });

  it("vuelve a consultar el servidor cuando la red regresa", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        calls += 1;
        if (calls === 1) {
          throw new Error("network down");
        }
        if (String(input).endsWith("/health/ready")) {
          return jsonResponse({
            status: "ready",
            checks: { database: "up" },
          });
        }
        return jsonResponse({ status: "ok", service: "field-service-api" });
      }),
    );

    render(<App />);
    expect(
      await screen.findByText("El servidor no responde"),
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(
      await screen.findByText("Base de datos disponible"),
    ).toBeInTheDocument();
  });

  it("explica la instalación en un iPhone", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const agent = vi.spyOn(navigator, "userAgent", "get");
    agent.mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    );

    render(<App />);
    await screen.findByRole("heading", { name: "Bienvenido, Técnico" });
    fireEvent.click(screen.getByRole("button", { name: "Instalar" }));

    expect(
      screen.getByText(/Añadir a pantalla de inicio/i),
    ).toBeInTheDocument();
  });

  it("abre Mis reportes sin inventar registros", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<App />);
    await screen.findByRole("heading", { name: "Bienvenido, Técnico" });
    fireEvent.click(screen.getByRole("button", { name: "Mis reportes" }));

    expect(
      screen.getByRole("heading", { name: "Mis reportes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Todavía no hay reportes guardados/i),
    ).toBeInTheDocument();
  });

  it("abre mapa, sincronización y ajustes con el estado real", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<App />);
    await screen.findByRole("heading", { name: "Bienvenido, Técnico" });
    fireEvent.click(screen.getByRole("button", { name: "Mapa" }));
    expect(screen.getByRole("heading", { name: "Mapa" })).toBeInTheDocument();
    expect(
      screen.getByText(/Todavía no hay reportes guardados/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sigue pendiente/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sincronización" }));
    expect(
      screen.getByRole("heading", { name: "Sincronización" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cola de envío" }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText("El servidor no responde")).length,
    ).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
    expect(
      screen.getByRole("heading", { name: "Ajustes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Red del navegador")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver reportes" }));
    expect(
      screen.getByRole("heading", { name: "Mis reportes" }),
    ).toBeInTheDocument();
  });

  it("pide una cuenta antes de abrir los reportes", async () => {
    await fieldServiceDatabase().account.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Crear una cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Bienvenido, Técnico" }),
    ).not.toBeInTheDocument();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
