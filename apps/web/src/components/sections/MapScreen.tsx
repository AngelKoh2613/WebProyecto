import type { LocalReport } from "../../features/reports/db";
import { reportsWithCoordinates } from "../../features/reports/map-points";
import { ReportMap } from "../../features/reports/ReportMap";
import { formatWhen } from "../../features/reports/format-when";
import { StatusBadge } from "../../features/reports/status-label";

export function MapScreen({
  reports,
  onOpenReport,
  onCreate,
}: {
  reports: LocalReport[];
  onOpenReport: (clientId: string) => void;
  onCreate: () => void;
}) {
  const located = reportsWithCoordinates(reports);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa</h1>
          <p className="mt-1 text-sm text-slate-600">
            {located.length === 1
              ? "1 reporte con coordenadas"
              : `${located.length} reportes con coordenadas`}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onCreate}
        >
          Crear reporte
        </button>
      </header>

      <ReportMap reports={reports} onOpenReport={onOpenReport} />
      <p className="text-xs text-slate-500">
        Las teselas salen de OpenStreetMap y necesitan conexión. Los puntos
        guardados siguen en este dispositivo.
      </p>

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600">
          Todavía no hay reportes guardados en este dispositivo.
        </p>
      ) : (
        <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {reports.map((report) => (
            <li key={report.clientId}>
              <button
                type="button"
                className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-slate-50"
                onClick={() => onOpenReport(report.clientId)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-900">
                    {report.description}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {report.latitude !== null && report.longitude !== null
                      ? `${report.latitude}, ${report.longitude}`
                      : "Sin coordenadas"}
                    {" · "}
                    {formatWhen(report.createdAt)}
                  </span>
                </span>
                <StatusBadge status={report.syncStatus} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
