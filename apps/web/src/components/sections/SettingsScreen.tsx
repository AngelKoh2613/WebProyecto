import { useSyncExternalStore } from "react";
import type { ApiStatus } from "../../app/api-status";
import { serverLabel } from "../../app/server-label";
import {
  getShellStatus,
  readOnline,
  subscribeOnline,
  subscribeShell,
} from "../../pwa/shell-status";

export function SettingsScreen({
  status,
  reportCount,
  onOpenReports,
  onOpenSync,
}: {
  status: ApiStatus;
  reportCount: number;
  onOpenReports: () => void;
  onOpenSync: () => void;
}) {
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true);
  const shell = useSyncExternalStore(
    subscribeShell,
    getShellStatus,
    getShellStatus,
  );

  const shellLabel = shell.registrationFailed
    ? "No se pudo preparar"
    : shell.offlineReady
      ? "Lista para abrirse sin conexión"
      : "Sin copia en este navegador";

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Estado de este dispositivo y del servidor.
        </p>
      </header>

      <dl className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Row
          label="Red del navegador"
          value={online ? "En línea" : "Sin conexión"}
        />
        <Row label="Servidor" value={serverLabel(status)} />
        <Row label="Interfaz sin conexión" value={shellLabel} />
        <Row label="Reportes en el dispositivo" value={String(reportCount)} />
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onOpenReports}
        >
          Ver reportes
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          onClick={onOpenSync}
        >
          Ver sincronización
        </button>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
