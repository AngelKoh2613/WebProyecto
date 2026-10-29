import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";
import {
  precachedPublicAssets,
  serviceWorkerPlan,
} from "./src/pwa/workbox-options";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const loopbackApiUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(?::\d+)?\/?$/i;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, "VITE_");
  const configuredApiUrl = env.VITE_API_URL ?? "";
  const productionDefines =
    mode === "production" && loopbackApiUrl.test(configuredApiUrl)
      ? { "import.meta.env.VITE_API_URL": JSON.stringify("") }
      : undefined;

  return {
    envDir: workspaceRoot,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: serviceWorkerPlan.registerType,
        injectRegister: false,
        manifest: false,
        includeAssets: [...precachedPublicAssets],
        workbox: {
          navigateFallback: serviceWorkerPlan.navigateFallback,
          navigateFallbackDenylist: [
            ...serviceWorkerPlan.navigateFallbackDenylist,
          ],
          cleanupOutdatedCaches: serviceWorkerPlan.cleanupOutdatedCaches,
          clientsClaim: serviceWorkerPlan.clientsClaim,
          skipWaiting: serviceWorkerPlan.skipWaiting,
          runtimeCaching: [...serviceWorkerPlan.runtimeCaching],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    ...(productionDefines ? { define: productionDefines } : {}),
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/health": "http://127.0.0.1:3000",
        "/api": "http://127.0.0.1:3000",
      },
    },
  };
});
