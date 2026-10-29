import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl } from "../../app/api-status";
import { fieldServiceDatabase } from "./db";
import type { LocalAccount, LocalReport, LocalSyncStatus } from "./db";
import {
  LocalStorageError,
  createLocalReport,
  listLocalReports,
  prepareManualRetry,
} from "./repository";
import {
  createHttpReportSender,
  pullRemoteReports,
  syncReportQueue,
} from "./sync";

export function useFieldReports(
  serverReachable: boolean,
  account: Pick<LocalAccount, "userId" | "name"> | null,
) {
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const rows = await listLocalReports(fieldServiceDatabase());
    setReports(
      account ? rows.filter((row) => row.userId === account.userId) : [],
    );
  }, [account]);

  const runSync = useCallback(
    async (manual = false) => {
      const online = navigator.onLine;
      if (!account) return;
      if (!online) {
        if (manual) {
          setNotice("Sin conexión. Los reportes siguen en este dispositivo.");
        }
        return;
      }
      if (!manual && !serverReachable) return;

      setSyncing(true);
      try {
        if (manual) await prepareManualRetry(fieldServiceDatabase());
        const now = new Date().toISOString();
        await syncReportQueue(
          fieldServiceDatabase(),
          createHttpReportSender(apiBaseUrl),
          { now: Date.parse(now), online: true, manual },
        );
        try {
          await pullRemoteReports(
            fieldServiceDatabase(),
            apiBaseUrl,
            now,
            account.userId,
          );
        } catch (error) {
          setNotice(
            error instanceof Error
              ? error.message
              : "No se pudieron traer los reportes guardados en el servidor.",
          );
        }
      } catch (error) {
        setStorageError(
          error instanceof LocalStorageError
            ? error.message
            : "No se pudo sincronizar los reportes.",
        );
      } finally {
        setSyncing(false);
        await refresh().catch(() => undefined);
      }
    },
    [account, refresh, serverReachable],
  );

  useEffect(() => {
    void refresh().catch((error: unknown) => {
      setStorageError(
        error instanceof Error
          ? error.message
          : "No se pudo abrir la base local.",
      );
    });
  }, [refresh]);

  useEffect(() => {
    void runSync(false);
    const onOnline = () => {
      void runSync(false);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void runSync(false);
    };
    const onPageShow = () => {
      void runSync(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [runSync]);

  useEffect(() => {
    if (!serverReachable || !navigator.onLine) return;
    const nextAttempt = reports.reduce<number | null>((soonest, report) => {
      if (!report.nextAttemptAt) return soonest;
      const time = Date.parse(report.nextAttemptAt);
      if (!Number.isFinite(time)) return soonest;
      return soonest === null ? time : Math.min(soonest, time);
    }, null);
    if (nextAttempt === null) return;
    const timer = window.setTimeout(
      () => {
        void runSync(false);
      },
      Math.max(0, nextAttempt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [reports, runSync, serverReachable]);

  async function save(
    description: string,
    latitude: number,
    longitude: number,
    syncStatus: Extract<LocalSyncStatus, "draft" | "pending">,
  ): Promise<void> {
    if (!account) {
      throw new Error("Entra con una cuenta para guardar el reporte.");
    }
    await createLocalReport(
      fieldServiceDatabase(),
      {
        description,
        latitude,
        longitude,
        userId: account.userId,
        technicianLabel: account.name,
      },
      syncStatus,
    );
    setNotice("El reporte quedó guardado en este dispositivo.");
    await refresh();
    if (syncStatus === "pending") void runSync(false);
  }

  return {
    reports,
    storageError,
    syncing,
    notice,
    save,
    retry: () => runSync(true),
  };
}
