import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ApiStatus } from "../../app/api-status";
import { serverLabel } from "../../app/server-label";
import { MapScreen } from "../sections/MapScreen";
import { SettingsScreen } from "../sections/SettingsScreen";
import { SyncScreen } from "../sections/SyncScreen";
import type { LocalReport } from "../../features/reports/db";
import { formatWhen } from "../../features/reports/format-when";
import { ReportsScreen } from "../../features/reports/ReportsScreen";
import { StatusBadge } from "../../features/reports/status-label";
import { useFieldReports } from "../../features/reports/use-field-reports";
import {
  getShellStatus,
  readOnline,
  requestShellUpdate,
  subscribeOnline,
  subscribeShell,
} from "../../pwa/shell-status";

export type SectionId =
  "inicio" | "reportes" | "mapa" | "sincronizacion" | "ajustes";

const navigation: Array<{ id: SectionId; label: string; icon: ReactNode }> = [
  { id: "inicio", label: "Inicio", icon: <HomeIcon /> },
  { id: "reportes", label: "Mis reportes", icon: <DocumentIcon /> },
  { id: "mapa", label: "Mapa", icon: <MapIcon /> },
  { id: "sincronizacion", label: "Sincronización", icon: <SyncIcon /> },
  { id: "ajustes", label: "Ajustes", icon: <SettingsIcon /> },
];

export function HomeScreen({
  status,
  section,
  onSectionChange,
}: {
  status: ApiStatus;
  section: SectionId;
  onSectionChange: (section: SectionId) => void;
}) {
  const fieldReports = useFieldReports(status.api === "up");
  const [composing, setComposing] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const counts = countReports(fieldReports.reports);
  const retryable = fieldReports.reports.some(
    (report) =>
      report.syncStatus === "pending" || report.syncStatus === "error",
  );
  const openComposer = () => {
    onSectionChange("reportes");
    setComposing(true);
  };
  const openReport = (clientId: string) => {
    setFocusedId(clientId);
    setComposing(false);
    onSectionChange("reportes");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto grid min-h-screen min-w-0 max-w-[1440px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-b border-slate-200 bg-white px-3 py-4 lg:border-r lg:border-b-0 lg:px-4 lg:py-5">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
              <WrenchIcon />
            </span>
            <span>
              <span className="block text-sm font-semibold">Field Service</span>
              <span className="block text-xs text-slate-500">
                Técnicos de Campo
              </span>
            </span>
          </div>
          <nav
            aria-label="Secciones"
            className="mt-6 flex min-w-0 gap-1 overflow-x-auto lg:flex-col"
          >
            {navigation.map((item) => {
              const selected = item.id === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                    selected
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => onSectionChange(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
          <OfflineNotice className="mt-auto hidden lg:block" />
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <ConnectionStatus
              status={status}
              syncing={fieldReports.syncing}
              readyToSync={retryable && status.api === "up"}
            />
          </header>

          <main className="px-4 py-5 sm:px-6 sm:py-6">
            {section === "inicio" ? (
              <Dashboard
                counts={counts}
                reports={fieldReports.reports}
                onCreate={openComposer}
                onOpenMap={() => onSectionChange("mapa")}
              />
            ) : section === "reportes" ? (
              <ReportsScreen
                reports={fieldReports.reports}
                storageError={fieldReports.storageError}
                notice={fieldReports.notice}
                syncing={fieldReports.syncing}
                composing={composing}
                focusedId={focusedId}
                onComposingChange={setComposing}
                onSave={fieldReports.save}
                onRetry={fieldReports.retry}
              />
            ) : section === "mapa" ? (
              <MapScreen
                reports={fieldReports.reports}
                onOpenReport={openReport}
                onCreate={openComposer}
              />
            ) : section === "sincronizacion" ? (
              <SyncScreen
                reports={fieldReports.reports}
                status={status}
                syncing={fieldReports.syncing}
                onRetry={fieldReports.retry}
                onOpenReport={openReport}
              />
            ) : (
              <SettingsScreen
                status={status}
                reportCount={fieldReports.reports.length}
                onOpenReports={() => onSectionChange("reportes")}
                onOpenSync={() => onSectionChange("sincronizacion")}
              />
            )}
          </main>
          <div className="px-4 pb-6 sm:px-6 lg:hidden">
            <OfflineNotice />
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflineNotice({ className = "" }: { className?: string }) {
  const shell = useSyncExternalStore(
    subscribeShell,
    getShellStatus,
    getShellStatus,
  );
  const shellLabel = shell.registrationFailed
    ? "No se pudo preparar"
    : shell.offlineReady
      ? "Lista en este navegador"
      : "Sin copia en este navegador";

  return (
    <div className={`rounded-2xl bg-slate-50 p-4 text-sm ${className}`}>
      <p className="flex items-center gap-2 font-semibold text-slate-800">
        <SignalIcon />
        Interfaz sin conexión
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{shellLabel}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Los reportes se guardan en este dispositivo y se envían cuando el
        servidor confirma la recepción.
      </p>
    </div>
  );
}

function countReports(reports: LocalReport[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    today: reports.filter(
      (report) => Date.parse(report.createdAt) >= start.getTime(),
    ).length,
    synced: reports.filter((report) => report.syncStatus === "synced").length,
    open: reports.filter(
      (report) =>
        report.syncStatus === "pending" ||
        report.syncStatus === "syncing" ||
        report.syncStatus === "error",
    ).length,
  };
}

function Dashboard({
  counts,
  reports,
  onCreate,
  onOpenMap,
}: {
  counts: { today: number; synced: number; open: number };
  reports: LocalReport[];
  onCreate: () => void;
  onOpenMap: () => void;
}) {
  const hasReports = reports.length > 0;
  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="relative h-44 sm:h-52">
          <FieldBanner />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/10" />
          <div className="absolute inset-0 flex max-w-xl flex-col justify-center px-6 sm:px-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Bienvenido, Técnico
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Registra y consulta tus reportes de servicio de forma rápida y
              segura, incluso en zonas rurales.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Resumen" className="grid gap-4 md:grid-cols-3">
        <Stat
          icon={<DocumentIcon />}
          iconClass="bg-blue-50 text-blue-600"
          value={String(counts.today)}
          label="Reportes de hoy"
        />
        <Stat
          icon={<CheckIcon />}
          iconClass="bg-green-50 text-green-600"
          value={String(counts.synced)}
          label="Reportes completados"
        />
        <Stat
          icon={<ClockIcon />}
          iconClass="bg-amber-50 text-amber-500"
          value={String(counts.open)}
          label="Reportes en proceso"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <DocumentIcon />
              </span>
              <div>
                <h2 className="font-semibold">Crear nuevo reporte</h2>
                <p className="text-sm text-slate-500">
                  Registra un nuevo servicio en campo.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              aria-label="Ir al formulario de reporte"
              onClick={onCreate}
            >
              <ChevronIcon />
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-blue-50/70 px-5 py-8 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <DocumentPlusIcon />
            </span>
            <h3 className="mt-4 font-semibold">
              {hasReports ? "Crear otro reporte" : "Registra tu primer reporte"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
              La descripción se guarda en este dispositivo.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={onCreate}
            >
              <PlusIcon />
              Crear reporte
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-green-600">
                <MapIcon />
              </span>
              <div>
                <h2 className="font-semibold">Ver en el mapa</h2>
                <p className="text-sm text-slate-500">
                  Reportes de este dispositivo, por día.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              aria-label="Ir al mapa"
              onClick={onOpenMap}
            >
              <ChevronIcon />
            </button>
          </div>
          <div className="relative mt-4 h-52 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {reports.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-600">
                No hay reportes en este dispositivo.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {reports.slice(0, 4).map((report) => (
                  <li
                    key={report.clientId}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {report.description}
                      </span>
                      <time
                        dateTime={report.createdAt}
                        className="mt-0.5 block text-xs text-slate-500"
                      >
                        {formatWhen(report.createdAt)}
                      </time>
                    </span>
                    <StatusBadge status={report.syncStatus} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={onOpenMap}
          >
            Abrir mapa
          </button>
        </article>
      </section>

      <p className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <ClockIcon />
        <span>
          <span className="font-semibold">
            Reportes guardados en el dispositivo.{" "}
          </span>
          {counts.open === 1
            ? "1 sin confirmación del servidor."
            : counts.open > 1
              ? `${counts.open} sin confirmación del servidor.`
              : counts.synced === 1
                ? "1 confirmado por el servidor."
                : counts.synced > 1
                  ? `${counts.synced} confirmados por el servidor.`
                  : "Se envían cuando el servidor confirma la recepción."}
        </span>
      </p>
    </div>
  );
}

function Stat({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: ReactNode;
  iconClass: string;
  value: string;
  label: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <span
        className={`grid size-11 place-items-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-2xl font-semibold">{value}</span>
        <span className="block text-sm text-slate-500">{label}</span>
      </span>
    </article>
  );
}

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

function ConnectionStatus({
  status,
  syncing,
  readyToSync,
}: {
  status: ApiStatus;
  syncing: boolean;
  readyToSync: boolean;
}) {
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true);
  const shell = useSyncExternalStore(
    subscribeShell,
    getShellStatus,
    getShellStatus,
  );
  const [install, setInstall] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showDetails =
    !online ||
    syncing ||
    readyToSync ||
    shell.offlineReady ||
    shell.updateAvailable ||
    shell.registrationFailed ||
    install !== null;

  return (
    <div className="mr-auto flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
            aria-hidden="true"
          />
          {online ? "En línea" : "Sin conexión"}
        </p>
        <p>{serverLabel(status)}</p>
      </div>
      {showDetails ? (
        <div
          role="status"
          aria-live="polite"
          className="flex max-w-xl flex-col gap-2 text-sm text-slate-700"
        >
          {syncing ? <p>Sincronización en curso</p> : null}
          {readyToSync && !syncing ? <p>Listo para sincronizar</p> : null}
          {shell.offlineReady ? (
            <p>La interfaz puede abrirse sin conexión.</p>
          ) : null}
          {!online ? (
            <p>
              No hay conexión. Los datos del servidor no están disponibles. Los
              reportes siguen en este dispositivo.
            </p>
          ) : null}
          {shell.registrationFailed ? (
            <p>No se pudo preparar la copia local de la interfaz.</p>
          ) : null}
          {shell.updateAvailable ? (
            <p className="flex flex-wrap items-center gap-3">
              <span>Actualización disponible</span>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                onClick={() => {
                  void requestShellUpdate();
                }}
              >
                Actualizar
              </button>
            </p>
          ) : null}
          {install ? (
            <button
              type="button"
              className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
              onClick={() => {
                void install.prompt().finally(() => {
                  setInstall(null);
                });
              }}
            >
              Instalar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FieldBanner() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 960 280"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Camino rural entre colinas"
    >
      <rect width="960" height="280" fill="#8ec5ef" />
      <path
        d="M0 170 C160 120 260 190 420 150 C560 116 680 180 960 120 L960 280 L0 280 Z"
        fill="#7dae57"
      />
      <path
        d="M0 210 C180 170 300 230 480 200 C650 172 760 220 960 180 L960 280 L0 280 Z"
        fill="#5f8f3e"
      />
      <path
        d="M520 214 C620 188 700 230 820 210 L860 250 L500 260 Z"
        fill="#c4b48a"
      />
      <g transform="translate(690 150)">
        <rect x="0" y="28" width="150" height="46" rx="8" fill="#f8fafc" />
        <path d="M78 28 L104 8 H138 Q150 8 150 20 V28 Z" fill="#e2e8f0" />
        <rect x="108" y="12" width="28" height="14" rx="2" fill="#bae6fd" />
        <circle cx="36" cy="78" r="14" fill="#334155" />
        <circle cx="118" cy="78" r="14" fill="#334155" />
      </g>
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M14.5 6.5a4 4 0 0 0-5.7 5.1L4 16.4 7.6 20l4.8-4.8a4 4 0 0 0 5.1-5.7l-2.4 2.4-2.2-2.2 2.4-2.4Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 3.5h7l4 4V20.5H7v-17Z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  );
}

function DocumentPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M7 3.5h7l4 4V20.5H7v-17Z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m9 18-5 2V6l5-2 6 2 5-2v14l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M4 16v-4h4M20 8v4h-4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 18v-3M10 18V9M15 18V6M20 18V3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.5 2.2 2.2 4.8-5.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
