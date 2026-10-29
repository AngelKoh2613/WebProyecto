import { useEffect, useMemo, useState } from "react";
import type { LocalReport, LocalSyncStatus } from "./db";
import { formatWhen } from "./format-when";
import { statusLabel, StatusBadge } from "./status-label";

const filters: Array<{ id: "all" | LocalSyncStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "draft", label: "Borradores" },
  { id: "pending", label: "Pendientes" },
  { id: "syncing", label: "Sincronizando" },
  { id: "error", label: "Con error" },
  { id: "synced", label: "Sincronizados" },
];

export function ReportsScreen({
  reports,
  storageError,
  notice,
  syncing,
  composing,
  focusedId = null,
  onComposingChange,
  onSave,
  onRetry,
}: {
  reports: LocalReport[];
  storageError: string | null;
  notice: string | null;
  syncing: boolean;
  composing: boolean;
  focusedId?: string | null;
  onComposingChange: (open: boolean) => void;
  onSave: (
    description: string,
    technicianLabel: string,
    syncStatus: Extract<LocalSyncStatus, "draft" | "pending">,
  ) => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(focusedId);
  const [filter, setFilter] = useState<"all" | LocalSyncStatus>("all");
  const [query, setQuery] = useState("");
  const retryable = reports.some(
    (report) =>
      report.syncStatus === "pending" || report.syncStatus === "error",
  );

  useEffect(() => {
    if (focusedId) setSelectedId(focusedId);
  }, [focusedId]);

  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    return reports.filter((report) => {
      if (filter !== "all" && report.syncStatus !== filter) return false;
      if (!text) return true;
      const technician = report.technicianLabel?.toLocaleLowerCase("es") ?? "";
      return (
        report.description.toLocaleLowerCase("es").includes(text) ||
        technician.includes(text)
      );
    });
  }, [filter, query, reports]);

  const selected =
    reports.find((report) => report.clientId === selectedId) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis reportes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {reports.length === 1
              ? "1 reporte en este dispositivo"
              : `${reports.length} reportes en este dispositivo`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {retryable ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              onClick={() => {
                void onRetry();
              }}
            >
              Reintentar sincronización
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => onComposingChange(true)}
          >
            Nuevo reporte
          </button>
        </div>
      </header>

      {storageError ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {storageError}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          {notice}
        </p>
      ) : null}
      {syncing ? (
        <p role="status" className="text-sm text-slate-600">
          Sincronización en curso
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div
          className="flex gap-2 overflow-x-auto"
          role="group"
          aria-label="Filtrar por estado"
        >
          {filters.map((item) => {
            const count =
              item.id === "all"
                ? reports.length
                : reports.filter((report) => report.syncStatus === item.id)
                    .length;
            const selectedFilter = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selectedFilter}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                  selectedFilter
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
                onClick={() => setFilter(item.id)}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="report-search"
        >
          Buscar
        </label>
        <input
          id="report-search"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600">
              Todavía no hay reportes guardados en este dispositivo.
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600">
              Ningún reporte coincide con este filtro.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {visible.map((report) => {
                const active = selectedId === report.clientId;
                return (
                  <li
                    key={report.clientId}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <div className={`px-4 py-3 ${active ? "bg-blue-50" : ""}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {report.description}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            <time dateTime={report.createdAt}>
                              {formatWhen(report.createdAt)}
                            </time>
                            {report.technicianLabel
                              ? ` · ${report.technicianLabel}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={report.syncStatus} />
                      </div>
                      {report.errorMessage ? (
                        <p className="mt-2 text-sm text-rose-700">
                          {report.errorMessage}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-blue-700"
                        aria-expanded={active}
                        onClick={() =>
                          setSelectedId((current) =>
                            current === report.clientId
                              ? null
                              : report.clientId,
                          )
                        }
                      >
                        Ver detalle
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {composing ? (
            <ReportForm
              onCancel={() => onComposingChange(false)}
              onSave={async (description, technicianLabel, syncStatus) => {
                await onSave(description, technicianLabel, syncStatus);
                onComposingChange(false);
              }}
            />
          ) : selected ? (
            <ReportDetail report={selected} />
          ) : reports.length > 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
              Elige un reporte para ver su detalle.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ReportForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (
    description: string,
    technicianLabel: string,
    syncStatus: Extract<LocalSyncStatus, "draft" | "pending">,
  ) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [technicianLabel, setTechnicianLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(
    syncStatus: Extract<LocalSyncStatus, "draft" | "pending">,
  ) {
    const nextError = validate(description, technicianLabel);
    if (nextError) {
      setError(nextError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(description, technicianLabel, syncStatus);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar el reporte.",
      );
      setSaving(false);
    }
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit("pending");
      }}
    >
      <h2 className="text-lg font-semibold">Nuevo reporte</h2>
      <label
        className="mt-4 block text-sm font-medium text-slate-700"
        htmlFor="report-description"
      >
        Descripción del servicio
      </label>
      <textarea
        id="report-description"
        className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        value={description}
        maxLength={2000}
        onChange={(event) => setDescription(event.target.value)}
      />
      <label
        className="mt-4 block text-sm font-medium text-slate-700"
        htmlFor="report-technician"
      >
        Técnico responsable
      </label>
      <input
        id="report-technician"
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        value={technicianLabel}
        maxLength={80}
        onChange={(event) => setTechnicianLabel(event.target.value)}
      />
      <p className="mt-1 text-xs text-slate-500">
        Opcional. No hay una cuenta de usuario, así que este texto no comprueba
        la identidad de una persona.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={saving}
        >
          Guardar reporte
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800"
          disabled={saving}
          onClick={() => {
            void submit("draft");
          }}
        >
          Guardar borrador
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-slate-600"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ReportDetail({ report }: { report: LocalReport }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
      <h2 className="text-lg font-semibold">Detalle del reporte</h2>
      <dl className="mt-3 grid gap-3">
        <div>
          <dt className="text-slate-500">Descripción</dt>
          <dd className="mt-0.5">{report.description}</dd>
        </div>
        {report.technicianLabel ? (
          <div>
            <dt className="text-slate-500">Técnico responsable</dt>
            <dd className="mt-0.5">{report.technicianLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">Creado</dt>
          <dd className="mt-0.5">{formatWhen(report.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Última modificación</dt>
          <dd className="mt-0.5">{formatWhen(report.updatedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sincronización</dt>
          <dd className="mt-0.5">{statusLabel[report.syncStatus]}</dd>
        </div>
        {report.attemptCount > 0 ? (
          <div>
            <dt className="text-slate-500">Intentos</dt>
            <dd className="mt-0.5">{report.attemptCount}</dd>
          </div>
        ) : null}
        {report.syncedAt ? (
          <div>
            <dt className="text-slate-500">Confirmado</dt>
            <dd className="mt-0.5">{formatWhen(report.syncedAt)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">Identificador local</dt>
          <dd className="mt-0.5 break-all">{report.clientId}</dd>
        </div>
        {report.remoteId ? (
          <div>
            <dt className="text-slate-500">Identificador remoto</dt>
            <dd className="mt-0.5 break-all">{report.remoteId}</dd>
          </div>
        ) : null}
      </dl>
      {report.errorMessage ? (
        <p className="mt-3 text-rose-700">{report.errorMessage}</p>
      ) : null}
      {report.syncStatus === "draft" ? null : (
        <p className="mt-3 text-slate-600">
          Este reporte ya no se puede modificar en el dispositivo.
        </p>
      )}
    </article>
  );
}

function validate(description: string, technicianLabel: string): string | null {
  if (description.trim().length === 0) {
    return "Escribe la descripción del servicio.";
  }
  if (description.trim().length > 2000) {
    return "La descripción admite hasta 2000 caracteres.";
  }
  if (technicianLabel.trim().length > 80) {
    return "El texto del técnico admite hasta 80 caracteres.";
  }
  return null;
}
