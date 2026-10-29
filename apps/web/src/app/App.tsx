import { useEffect, useState } from "react";
import { HomeScreen, type SectionId } from "../components/home/HomeScreen";
import { AuthScreen } from "../features/auth/AuthScreen";
import {
  clearLocalAccount,
  readLocalAccount,
  saveLocalAccount,
} from "../features/auth/local-account";
import { logoutAccount } from "../features/auth/session";
import type { LocalAccount } from "../features/reports/db";
import { fieldServiceDatabase } from "../features/reports/db";
import { claimUnassignedReports } from "../features/reports/repository";
import { apiBaseUrl, readApiStatus, type ApiStatus } from "./api-status";

export function App() {
  const [status, setStatus] = useState<ApiStatus>({ api: "checking" });
  const [section, setSection] = useState<SectionId>("inicio");
  const [account, setAccount] = useState<LocalAccount | null | "loading">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();

    const probe = () => {
      void readApiStatus(apiBaseUrl, controller.signal)
        .then((next) => {
          if (!controller.signal.aborted) {
            setStatus(next);
          }
        })
        .catch(() => undefined);
    };

    probe();
    const onOnline = () => {
      probe();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") probe();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      controller.abort();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const db = fieldServiceDatabase();
    void readLocalAccount(db)
      .then(async (stored) => {
        if (stored) await claimUnassignedReports(db, stored.userId);
        setAccount(stored);
      })
      .catch(() => setAccount(null));
  }, []);

  async function enter(profile: { id: string; name: string; email: string }) {
    const db = fieldServiceDatabase();
    const stored = await saveLocalAccount(db, {
      userId: profile.id,
      name: profile.name,
      email: profile.email,
    });
    await claimUnassignedReports(db, stored.userId);
    setAccount(stored);
    setSection("inicio");
  }

  async function leave() {
    await logoutAccount();
    await clearLocalAccount(fieldServiceDatabase());
    setAccount(null);
    setSection("inicio");
  }

  if (account === "loading") {
    return (
      <p className="px-4 py-6 text-sm text-slate-600">Cargando la cuenta.</p>
    );
  }

  if (!account) {
    return <AuthScreen onReady={enter} />;
  }

  return (
    <HomeScreen
      status={status}
      section={section}
      onSectionChange={setSection}
      account={account}
      onLogout={() => {
        void leave();
      }}
    />
  );
}
