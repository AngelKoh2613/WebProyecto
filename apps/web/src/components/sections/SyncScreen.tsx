import type { ApiStatus } from "../../app/api-status";
import { serverLabel } from "../../app/server-label";
import type { LocalReport } from "../../features/reports/db";
import { formatWhen } from "../../features/reports/format-when";
import { StatusBadge } from "../../features/reports/status-label";

export function SyncScreen({
  reports,
  status,
  syncing,
  onRetry,
  onOpenReport,
}: {
  reports: LocalReport[];
  status: ApiStatus;
  syncing: boolean;
  onRetry: () => Promise<void>;
  onOpenReport: (clientId: string) => void;
}) {
  const queue = reports.filter((report) => report.syncStatus !== "synced");
  const confirmed = reports.filter((report) => report.syncStatus === "synced");
  const retryable = reports.some(
    (report) =>
      report.syncStatus === "pending" || report.syncStatus === "error",
  );

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sincronización
          </h1>
          <p className="mt-1 text-sm text-slate-600">{serverLabel(status)}</p>
        </div>
        {retryable ? (
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => {
              void onRetry();
            }}
          >
            Reintentar sincronización
          </button>
        ) : null}
      </header>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Count label="En espera" value={countStatus(reports, "waiting")} />
        <Count label="Con error" value={countStatus(reports, "error")} />
        <Count label="Confirmados" value={confirmed.length} />
      </dl>

      {syncing ? (
        <p role="status" className="text-sm text-slate-700">
          Sincronización en curso
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Cola de envío</h2>
        </div>
        {queue.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            No hay reportes pendientes.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {queue.map((report) => (
              <li key={report.clientId} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 text-left font-medium text-slate-900 hover:text-blue-700"
                    onClick={() => onOpenReport(report.clientId)}
                  >
                    {report.description}
                  </button>
                  <StatusBadge status={report.syncStatus} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {report.attemptCount === 1
                    ? "1 intento"
                    : `${report.attemptCount} intentos`}
                  {report.nextAttemptAt
                    ? ` · próximo ${formatWhen(report.nextAttemptAt)}`
                    : ""}
                </p>
                {report.errorMessage ? (
                  <p className="mt-2 text-sm text-rose-700">
                    {report.errorMessage}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Confirmados por el servidor</h2>
        </div>
        {confirmed.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            Ningún reporte de este dispositivo tiene confirmación.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {confirmed.map((report) => (
              <li key={report.clientId}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  onClick={() => onOpenReport(report.clientId)}
                >
                  <span>
                    <span className="block font-medium text-slate-900">
                      {report.description}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {report.syncedAt
                        ? formatWhen(report.syncedAt)
                        : formatWhen(report.updatedAt)}
                    </span>
                  </span>
                  <StatusBadge status={report.syncStatus} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function countStatus(
  reports: LocalReport[],
  kind: "waiting" | "error",
): number {
  return reports.filter((report) =>
    kind === "error"
      ? report.syncStatus === "error"
      : report.syncStatus === "pending" ||
        report.syncStatus === "syncing" ||
        report.syncStatus === "draft",
  ).length;
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}
