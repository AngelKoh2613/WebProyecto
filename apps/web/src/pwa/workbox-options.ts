export const serviceWorkerPlan = {
  registerType: "prompt" as const,
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/health(?:\/|$)/],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: false,
  runtimeCaching: [] as const,
};

export const precachedPublicAssets = [
  "favicon.svg",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
] as const;
