# `@field-service/web`

Interfaz React servida por Vite. El manifiesto y el Service Worker permiten instalar la interfaz y volver a abrirla sin red después de una primera carga. Los reportes se guardan en IndexedDB con Dexie y se envían a `POST /api/v1/reports` cuando la API responde. El detalle está en ADR-006.

No importa módulos internos de `apps/api`. Los tipos y los esquemas compartidos entran por `@field-service/contracts` y `@field-service/validation`.

La pantalla inicial identifica el sistema de reportes técnicos y consulta `GET /health` y `GET /health/ready`. `VITE_API_URL` vacío usa rutas relativas. En desarrollo, Vite reenvía `/health` y `/api` a `http://127.0.0.1:3000`. En producción, Fastify sirve `dist/` y esas rutas son del mismo origen. El build falla si el paquete contiene `127.0.0.1` o `localhost` como URL.

`public/manifest.webmanifest` y los PNG de `public/icons/` se copian al build. En desarrollo Vite los sirve y no registra el Service Worker. En producción, `registerProductionServiceWorker` registra el `sw.js` generado por Workbox. El plan de caché está en `src/pwa/workbox-options.ts`.

Comandos, desde la raíz del repositorio:

```bash
pnpm --filter @field-service/web dev
pnpm --filter @field-service/web test
pnpm --filter @field-service/web build
```

El resultado de la última verificación está en `docs/development/phase-status.md`.
