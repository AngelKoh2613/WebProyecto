# `@field-service/api`

API HTTP con Fastify. Separa el arranque (`src/server.ts`), la construcción de la aplicación (`src/app`), la configuración (`src/config`), la seguridad y CORS (`src/plugins`), las rutas de sistema (`src/routes`), el acceso a datos (`src/db`) y las respuestas de error (`src/shared`).

`GET /health` comprueba el proceso y no abre PostgreSQL. `GET /health/ready` informa si la base está sin configurar, caída o disponible. `GET /api/v1` identifica la versión inicial. `POST /api/v1/reports` crea o recupera un reporte por `clientId`. `GET /api/v1/reports/:clientId` devuelve ese reporte. No hay listado general ni autenticación. Si la base no está configurada, esos dos recursos responden 503.

Con `NODE_ENV=production`, el mismo proceso sirve `apps/web/dist` en `/`. Una ruta de cliente recibe `index.html`. `/api` y `/health` que no existen siguen en JSON. En desarrollo ese directorio no se sirve: lo hace Vite.

Comandos, desde la raíz:

```bash
pnpm --filter @field-service/api dev
pnpm --filter @field-service/api test
pnpm --filter @field-service/api build
pnpm --filter @field-service/api start
pnpm --filter @field-service/api db:generate
pnpm --filter @field-service/api db:migrate
```

`start` requiere haber ejecutado `pnpm build` en la raíz. En desarrollo el servidor escucha en `127.0.0.1:3000` salvo que `API_HOST` y `API_PORT`, o en su defecto `HOST` y `PORT`, estén definidos. En producción mandan `HOST` y `PORT`; si `HOST` falta, escucha en `0.0.0.0`. Node no carga `.env` por sí solo; para usarlo:

```bash
node --env-file=.env apps/api/dist/server.js
```

Ese comando solo funciona cuando `.env` ya existe. `db:migrate` acepta `field_service_dev` en `127.0.0.1` o `localhost`, y `appweb_ykvs` en el host de desarrollo ya identificado. Rechaza cualquier otro destino y no se ejecuta al arrancar.
