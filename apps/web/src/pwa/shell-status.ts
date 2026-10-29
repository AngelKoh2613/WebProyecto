type ShellState = {
  offlineReady: boolean;
  updateAvailable: boolean;
  registrationFailed: boolean;
};

const initialState: ShellState = {
  offlineReady: false,
  updateAvailable: false,
  registrationFailed: false,
};

let state: ShellState = initialState;
let applyUpdate: (() => Promise<void>) | undefined;
const listeners = new Set<() => void>();

function publish(next: ShellState) {
  state = next;
  for (const listener of listeners) listener();
}

export function getShellStatus(): ShellState {
  return state;
}

export function subscribeShell(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markShellReady(): void {
  publish({ ...state, offlineReady: true, registrationFailed: false });
}

export function markUpdateAvailable(apply: () => Promise<void>): void {
  applyUpdate = apply;
  publish({ ...state, updateAvailable: true });
}

export function markRegistrationFailed(): void {
  publish({ ...state, registrationFailed: true, offlineReady: false });
}

export function requestShellUpdate(): Promise<void> | undefined {
  return applyUpdate?.();
}

export function resetShellStatus(): void {
  applyUpdate = undefined;
  publish(initialState);
}

export function subscribeOnline(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

export function readOnline(): boolean {
  return navigator.onLine;
}
