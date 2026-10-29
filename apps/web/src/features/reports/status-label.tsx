import type { LocalSyncStatus } from "./db";

export const statusLabel: Record<LocalSyncStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente de sincronización",
  syncing: "Sincronizando",
  synced: "Sincronizado",
  error: "Error de sincronización",
};

export const statusClass: Record<LocalSyncStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-950",
  syncing: "bg-blue-100 text-blue-800",
  synced: "bg-green-100 text-green-800",
  error: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: LocalSyncStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
