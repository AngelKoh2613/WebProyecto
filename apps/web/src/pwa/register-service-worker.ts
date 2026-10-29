import { registerSW } from "virtual:pwa-register";
import {
  markRegistrationFailed,
  markShellReady,
  markUpdateAvailable,
} from "./shell-status";
import { shouldTakeWaitingWorker, watchAppForeground } from "./shell-update";

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

  let applying = false;
  let stopWatching: (() => void) | undefined;

  const applyWaitingWorker = (waiting: boolean) => {
    if (
      !shouldTakeWaitingWorker({
        controlled: Boolean(navigator.serviceWorker.controller),
        waiting,
        applying,
      })
    ) {
      return;
    }
    applying = true;
    void updateServiceWorker(true);
  };

  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      markShellReady();
    },
    onNeedRefresh() {
      markUpdateAvailable(() => updateServiceWorker(true));
      applyWaitingWorker(true);
    },
    onRegisteredSW(_scriptUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        void registration.update().then(
          () => {
            applyWaitingWorker(Boolean(registration.waiting));
          },
          () => undefined,
        );
      };
      checkForUpdate();
      stopWatching?.();
      stopWatching = watchAppForeground(checkForUpdate);
    },
    onRegisterError() {
      markRegistrationFailed();
    },
  });
}
