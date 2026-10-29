# Despliegue en Render

Estado: en vivo desde el 2026-10-28. ADR-010 define un solo servicio web. `render.yaml` está en la raíz y no se aplicó como blueprint. El servicio `WebProyecto` se creó en el panel. La URL es `https://webproyecto.onrender.com`. No hay captura de la pantalla.

## Forma

Un servicio web de Node ejecuta `node apps/api/dist/server.js`. Ese proceso sirve la API y los archivos de `apps/web/dist`. PostgreSQL sigue fuera del proceso. El blueprint no crea una base.

| Pieza                  | Dónde vive                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- |
| Build                  | `npm install -g pnpm@12.15.0 && pnpm install --frozen-lockfile && pnpm build` |
| Arranque               | `node apps/api/dist/server.js`                                                |
| Sonda                  | `GET /health`                                                                 |
| Plan del blueprint     | `free`. Render usa un plan de pago si el campo se omite.                      |
| Publicación automática | `off`. Hay que desplegar a mano después de revisar el blueprint.              |

Node 22.14.0 trae un Corepack que no arranca pnpm 12.15.0. Por eso el build instala pnpm con npm antes de `pnpm install`. Esa instalación no se ha ejecutado en Render.

## Desarrollo y producción

En desarrollo, Vite escucha en `http://127.0.0.1:5173` y reenvía `/health` y `/api` a Fastify en el puerto 3000. Fastify no sirve el build.

En producción, el navegador y la API comparten origen. Las llamadas usan rutas relativas. `VITE_API_URL` debe quedar vacío. Si el build viera `http://127.0.0.1` o `http://localhost`, Vite lo descarta y la compilación falla si el paquete aún lo contiene.

`NODE_ENV=production` hace que `HOST` y `PORT` ignoren `API_HOST` y `API_PORT`. Sin `HOST`, el proceso escucha en `0.0.0.0`. Render asigna `PORT`. No definas `API_HOST=127.0.0.1` en el servicio: en desarrollo esa variable sigue teniendo prioridad y dejaría el proceso cerrado al exterior si alguien arrancara sin `NODE_ENV=production`.

CORS queda apagado si `CORS_ORIGIN` está vacío. No hace falta para el mismo origen. `*` se rechaza. No actives `trustProxy`: el límite de peticiones usa la dirección de la conexión y un proxy no confirmado permitiría falsificarla.

## Variables que se configuran en el panel

| Variable                | Valor                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_VERSION`          | `22.14.0`, ya escrito en el blueprint                                                                                                                      |
| `NODE_ENV`              | `production`, ya escrito en el blueprint                                                                                                                   |
| `HOST`                  | `0.0.0.0`, ya escrito en el blueprint                                                                                                                      |
| `LOG_LEVEL`             | `info`, ya escrito en el blueprint                                                                                                                         |
| `DATABASE_URL`          | Secreto. El blueprint lo deja vacío para que el panel lo pida. Pega la URL de la base de desarrollo ya creada, `appweb_ykvs`, sin copiarla al repositorio. |
| `PORT`                  | Lo asigna Render. No lo escribas.                                                                                                                          |
| `VITE_API_URL`          | No la definas.                                                                                                                                             |
| `CORS_ORIGIN`           | No la definas.                                                                                                                                             |
| `API_HOST` y `API_PORT` | No las definas.                                                                                                                                            |

No subas `.env`. La migración no corre al arrancar. `db:migrate` solo acepta `field_service_dev` en local y `appweb_ykvs` en su host ya comprobado. La migración técnica ya está aplicada en esa base. Otra base queda rechazada hasta revisar esa protección a propósito.

## Comprobación cuando exista el servicio

Comprobado el 2026-10-29 contra `https://webproyecto.onrender.com`. No se guardó una captura del navegador.

1. `GET /` respondió 200 con el HTML de la interfaz.
2. `GET /health` respondió 200.
3. `GET /health/ready` respondió 200 con `database: up`.
4. `GET /api/v1` identificó `v1`.
5. `GET /api/missing` respondió 404 JSON.
6. `GET /mis-reportes` respondió el HTML de la interfaz.

## Desarrollo local

```bash
pnpm --filter @field-service/web dev
pnpm --filter @field-service/api dev
```

Producción local, después de `pnpm build`:

```bash
$env:NODE_ENV = "production"
$env:HOST = "127.0.0.1"
$env:PORT = "3000"
node apps/api/dist/server.js
```

En cmd, `set NODE_ENV=production`. No hace falta `VITE_API_URL`. Un túnel de prueba sigue descrito en `docs/testing/https-tunnel.md` y no sustituye el TLS de Render.
