import { registerSW } from "virtual:pwa-register";
import {
  markRegistrationFailed,
  markShellReady,
  markUpdateAvailable,
} from "./shell-status";

function watchControlledShell(): void {
  if (!("serviceWorker" in navigator)) return;

  const markIfControlled = () => {
    if (navigator.serviceWorker.controller) markShellReady();
  };

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    markIfControlled,
  );
  markIfControlled();
}

export function registerProductionServiceWorker(): void {
  // The development virtual module is a no-op. Checking import.meta.env.PROD
  // here would be folded away in the Vite 8 client bundle and the registration
  // would disappear from the production JavaScript.
  watchControlledShell();
  let updateServiceWorker: (reloadPage?: boolean) => Promise<void> = async () =>
    undefined;

  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      markShellReady();
    },
    onNeedRefresh() {
      markUpdateAvailable(() => updateServiceWorker(true));
    },
    onRegisterError() {
      markRegistrationFailed();
    },
  });
}
