import type { LocalReport } from "../../features/reports/db";
import { dayKey, formatDay } from "../../features/reports/format-when";
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
  const groups = groupByDay(reports);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa</h1>
          <p className="mt-1 text-sm text-slate-600">
            {reports.length === 1
              ? "1 reporte en este dispositivo"
              : `${reports.length} reportes en este dispositivo`}
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

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600">
          Todavía no hay reportes guardados en este dispositivo.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="text-sm font-semibold text-slate-800">
                {group.label}
              </h2>
              <ol className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {group.reports.map((report) => (
                  <li key={report.clientId}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-slate-50"
                      onClick={() => onOpenReport(report.clientId)}
                    >
                      <time
                        dateTime={report.createdAt}
                        className="w-16 shrink-0 pt-0.5 text-xs font-medium text-slate-500"
                      >
                        {formatClock(report.createdAt)}
                      </time>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900">
                          {report.description}
                        </span>
                        {report.technicianLabel ? (
                          <span className="mt-1 block text-sm text-slate-500">
                            {report.technicianLabel}
                          </span>
                        ) : null}
                      </span>
                      <StatusBadge status={report.syncStatus} />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupByDay(reports: LocalReport[]) {
  const order: string[] = [];
  const grouped = new Map<string, LocalReport[]>();
  for (const report of reports) {
    const key = dayKey(report.createdAt);
    const current = grouped.get(key);
    if (current) {
      current.push(report);
    } else {
      grouped.set(key, [report]);
      order.push(key);
    }
  }
  return order.map((key) => {
    const rows = grouped.get(key) ?? [];
    return {
      key,
      label: formatDay(rows[0]?.createdAt ?? key),
      reports: rows,
    };
  });
}

function formatClock(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat("es", { timeStyle: "short" }).format(
    new Date(time),
  );
}
