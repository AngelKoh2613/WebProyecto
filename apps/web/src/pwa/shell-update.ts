export function shouldTakeWaitingWorker(input: {
  controlled: boolean;
  waiting: boolean;
  applying: boolean;
}): boolean {
  return input.controlled && input.waiting && !input.applying;
}

export function watchAppForeground(check: () => void): () => void {
  const onOpen = () => {
    check();
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") check();
  };
  window.addEventListener("pageshow", onOpen);
  window.addEventListener("focus", onOpen);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("pageshow", onOpen);
    window.removeEventListener("focus", onOpen);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
