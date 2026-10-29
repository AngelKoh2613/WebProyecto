import { useEffect, useState } from "react";
import { HomeScreen, type SectionId } from "../components/home/HomeScreen";
import { apiBaseUrl, readApiStatus, type ApiStatus } from "./api-status";

export function App() {
  const [status, setStatus] = useState<ApiStatus>({ api: "checking" });
  const [section, setSection] = useState<SectionId>("inicio");

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

  return (
    <HomeScreen
      status={status}
      section={section}
      onSectionChange={setSection}
    />
  );
}
