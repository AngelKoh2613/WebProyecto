# Estado de la fase

## Sprint 2, fase 3: validación, 2026-10-27

La prueba de extremo a extremo contra el build de producción pasó. Lighthouse se ejecutó en `http://127.0.0.1:3012`, no en un sitio público. Android, iOS y el despliegue HTTPS siguen pendientes. El detalle y la matriz están en `docs/testing/sprint-2-evidence.md`.

El Sprint 2 está implementado y cubierto por pruebas automatizadas. No está validado por completo: faltan el teléfono y, al final, la URL HTTPS.

El despliegue queda al último. GitHub, Render, el túnel y la captura HTTPS no se hacen hasta cerrar el resto. `render.yaml` sigue sin aplicarse.

| Comando                         | Resultado                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm lint`                     | Sin avisos                                                                         |
| `pnpm format:check`             | Sin diferencias                                                                    |
| `pnpm typecheck`                | 7 tareas correctas                                                                 |
| `pnpm test`                     | API 34 correctas, 0 fallidas, 0 omitidas. Web 22 correctas, 0 fallidas, 0 omitidas |
| `pnpm e2e`                      | Correcta en Edge headless. No forma parte de CI                                    |
| `pnpm audit --audit-level=high` | Sin avisos altos. Quedan una moderada de `esbuild` y una baja de `deepmerge`       |
| Lighthouse 12.8.2               | Performance 96, Accessibility 100, Best Practices 96, SEO 100. Sin categoría PWA   |
| Lighthouse 11.7.1               | PWA 100 en local                                                                   |

## Sprint 2, fase 2: reportes offline y sincronización, 2026-10-27

Un reporte se guarda en IndexedDB, sobrevive a una base nueva en las pruebas y se envía a `POST /api/v1/reports`. El mismo `clientId` no crea otra fila. No hay autenticación ni listado general. No se inició la fase 3: no hay prueba de instalación en Android o iOS, ni Lighthouse, ni evidencia de despliegue.

Comprobación de esta fase, ejecutada el 2026-10-27:

| Comando          | Resultado                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`      | Sin avisos                                                                                                                                                          |
| `pnpm typecheck` | 7 tareas correctas                                                                                                                                                  |
| `pnpm test`      | API 34 correctas, 0 fallidas y 0 omitidas. Incluye la integración con PostgreSQL. Web 20 correctas, 0 fallidas y 0 omitidas                                         |
| `pnpm build`     | Web: CSS 18.54 kB, JS 653.14 kB (gzip 194.79 kB), `workbox-window` 5.65 kB. Precaché de 10 entradas, 662.27 KiB. `assert-relative-api` y `assert-pwa-build` pasaron |

`node --env-file=../../.env ./node_modules/drizzle-kit/bin.cjs migrate`, desde `apps/api`, aplicó las migraciones sobre la base de desarrollo identificada. La prueba `keeps a single remote report when the same client id is repeated` pasó en 1706 ms y borró solo esa fila. La red de la cola se simuló con Vitest.

En el navegador, contra Vite en `http://127.0.0.1:5173` y la API en `127.0.0.1:3000`, se guardó un reporte. El aviso dijo que quedó en el dispositivo, el estado pasó a sincronizado y `POST /api/v1/reports` respondió 201. Tras recargar, el reporte seguía en Mis reportes. Esa fila de verificación se borró después. No es una prueba de teléfono ni de red cortada en el dispositivo.

## Sprint 2, fase 1: interfaz instalable, 2026-10-27

Hay manifiesto, iconos PNG de 192 y 512, y un Service Worker de Workbox generado en el build. Precachea la interfaz y deja `/api` y `/health` fuera del fallback de navegación. No hay IndexedDB, cola de reportes ni sincronización.

Comprobación de esta fase:

| Comando          | Resultado                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`      | Sin avisos                                                                                                                             |
| `pnpm typecheck` | 7 tareas correctas                                                                                                                     |
| `pnpm test`      | API 28, incluida la integración real con PostgreSQL. Web 10                                                                            |
| `pnpm build`     | Web: CSS 17.07 kB, JS 537.56 kB, `workbox-window` 5.65 kB. Precaché de 10 entradas. `assert-relative-api` y `assert-pwa-build` pasaron |

Edge sin interfaz, contra `http://127.0.0.1:3011`, registró un solo `sw.js`. Con la red cortada, una navegación nueva abrió la interfaz, mostró «Sin conexión», «El servidor no responde» y «La interfaz puede abrirse sin conexión». `GET /health` y `POST /api/v1` fallaron. No se probó Android ni iOS. El procedimiento manual sigue en `docs/testing/pwa-installation-checklist.md`.

## Servicio único, 2026-10-27

Fastify puede servir el build de React cuando `NODE_ENV=production`. `render.yaml` describe ese servicio con plan `free` y sin base nueva. No se aplicó el blueprint y no hay URL HTTPS. El resultado de las pruebas de este cambio se anota al final de `docs/testing/sprint-1-evidence.md`.

Fecha de cierre local del Sprint 1: 2026-10-27.

La conexión a la base de desarrollo `appweb_ykvs` funciona, la migración aditiva está aplicada y `GET /health/ready` respondió `database: up`. El Sprint 1 queda pendiente de una sola validación manual: la captura del entorno servido por HTTPS. No hay túnel instalado y no se fabricó esa imagen. La fase 1 del Sprint 2, descrita arriba, añade el shell de la PWA y deja los reportes offline para después.

## Clasificación

| Elemento                                                    | Categoría                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Arquitectura, matriz y compatibilidad documentada           | COMPLETADO                                                                                                   |
| API `GET /health`, `GET /health/ready`, `GET /api/v1` y 404 | COMPLETADO                                                                                                   |
| Conexión PostgreSQL, migración y prueba de integración      | COMPLETADO                                                                                                   |
| Calidad: formato, lint, TypeScript, pruebas y build         | COMPLETADO                                                                                                   |
| Auditoría alta                                              | COMPLETADO. La auditoría completa sigue informando una vulnerabilidad moderada de `esbuild` en `drizzle-kit` |
| Captura HTTPS y acceso desde un teléfono                    | PENDIENTE MANUAL                                                                                             |
| Instalación PWA, Service Worker, IndexedDB y sincronización | NO APLICA EN SPRINT 1                                                                                        |
| Commit, remoto y despliegue en Render                       | PENDIENTE MANUAL. No se publicó nada                                                                         |

## Fase 3

Fecha de la fase 3: 2026-10-26.

La fase 3 cierra la documentación del Sprint 1. Añade la matriz de decisión, la compatibilidad por sistema, el checklist de instalación, el procedimiento de túnel HTTPS y la tabla de evidencias. No añade manifiesto, Service Worker ni capturas de un sitio público.

## Fase 3, comprobado

| Comando o consulta                                | Resultado                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `node apps/api/dist/server.js` sin `DATABASE_URL` | `/health` 200, `/health/ready` 503 `not_configured`, `/api/v1` 200. El proceso se detuvo. El log no contenía `postgresql://` |
| `Origin: http://127.0.0.1:5173` contra `/health`  | No apareció `Access-Control-Allow-Origin`. Coincide con `CORS_ORIGIN` vacío                                                  |
| Servicio `postgresql-x64-18`                      | En ejecución. Sigue sin `DATABASE_URL`                                                                                       |
| `ngrok`, `cloudflared` y `lt`                     | No están en el `PATH`. El túnel no se inició y no hay capturas HTTPS                                                         |
| Búsqueda en `apps/web` de HTML, TS y TSX          | Sin `serviceWorker` y sin enlace `rel="manifest"`. `public/README.md` solo reserva los nombres del Sprint 2                  |

Las evidencias están en `docs/testing/sprint-1-evidence.md`.

## Fase 2

Fecha de la fase 2: 2026-10-26.

La fase 2 deja ejecutables la web, la API y la configuración de PostgreSQL. La conexión autenticada y la aplicación de la migración siguen bloqueadas: el servicio `postgresql-x64-18` está en ejecución y `psql -w` responde `fe_sendauth: no password supplied`. No hay commit. El repositorio Git local sigue en la rama `main`, sin commits y sin remoto.

## Fase 2, implementado y probado

- React, TypeScript y Vite arrancan con una pantalla que identifica el sistema de reportes técnicos.
- Fastify responde `GET /health`, `GET /health/ready` y `GET /api/v1`.
- Los contratos y los esquemas Zod viven en `packages/contracts` y `packages/validation`.
- Drizzle genera la migración aditiva `database/migrations/0000_create_infrastructure_checks.sql`.
- El proceso cierra el pool al cerrar Fastify. La prueba de integración real queda omitida.
- La PWA, el Service Worker, la caché offline y la sincronización siguen fuera de esta fase.

## Comandos de la fase 2

Todos se ejecutaron en `C:\Users\unixc\Desktop\AppWeb` el 2026-10-26. El código de salida fue 0 salvo donde se indica.

| Comando                                        | Resultado                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                               | 7 tareas correctas, después de corregir el `signal` opcional de `fetch`                                                                                       |
| `pnpm lint`                                    | ESLint sin errores, después de quitar una asignación inicial en `drizzle.config.ts`                                                                           |
| `pnpm test`                                    | API: 17 pruebas correctas y 1 omitida. Web: 3 pruebas en 2 archivos                                                                                           |
| `pnpm format` y `pnpm format:check`            | Prettier reescribió los archivos pendientes. La comprobación posterior terminó en verde                                                                       |
| `pnpm build`                                   | Contratos, validación, API y web. Vite 8.3.5 emitió CSS de 6.84 kB y JS de 302.37 kB                                                                          |
| `pnpm audit --audit-level=high`                | Código 0. `pnpm audit` informa 1 vulnerabilidad moderada: `esbuild` `<=0.24.2`, arrastrado por `drizzle-kit` mediante `@esbuild-kit`                          |
| `pnpm --filter @field-service/api db:generate` | Generó la tabla `infrastructure_checks`. El SQL se renombró a `0000_create_infrastructure_checks.sql` y el journal usa esa etiqueta                           |
| `node apps/api/dist/server.js`                 | Sin `DATABASE_URL`: `/health` 200, `/health/ready` 503 `not_configured`, `/api/v1` 200, `/missing` 404. Log `databaseConfigured: false`. El proceso se detuvo |
| Mismo proceso con la URL ilustrativa           | `/health` 200 y `/health/ready` 503 `down`. El log dice `database readiness check failed` y no contiene `postgresql://`. El proceso se detuvo                 |
| `psql -w` contra `127.0.0.1:5432`              | Código 2. `fe_sendauth: no password supplied`                                                                                                                 |
| `pnpm --filter @field-service/web dev`         | Vite listo en `http://127.0.0.1:5173/`. El HTML trae el título `Servicios técnicos de campo`. El proceso se detuvo. No se abrió una ventana de navegador      |

## PostgreSQL

La prueba `postgres.integration.test.ts` permanece omitida porque `DATABASE_URL` no apunta a `field_service_dev`. Los resultados 503 `down` y 200 `ready` de Vitest usan un doble de `DatabaseProbe`. El 503 `down` del proceso compilado sí intentó conectar con la URL ilustrativa y la instancia rechazó la autenticación. Eso no cuenta como migración aplicada ni como integración correcta.

## Preparación para Render

El servicio único y `render.yaml` quedaron preparados el 2026-10-27. Esta sección describía la ausencia del blueprint. El estado vigente está al inicio de este documento y en `docs/deployment/render.md`. La sonda sigue siendo `GET /health`. Las migraciones no corren al arrancar.

## Pendiente de aprobación

1. Crear el commit inicial y el remoto de GitHub.
2. Plan, región y nombres de Render antes de escribir `render.yaml`.
3. Autorizar el rol y la base `field_service_dev` para aplicar la migración contra PostgreSQL 18.
4. Confirmar que la interfaz de producto se mantiene en español.
5. Subir a TypeScript 7 cuando `typescript-eslint` lo acepte.
6. Actualizar Node.js si se quiere Corepack 0.36 o jsdom 30.
7. Decidir si el límite `field_service_dev` de `db:migrate` se sustituye por otro control antes de usarlo en Render.

## Fase 3, sin empezar

- Añadir el manifiesto, los iconos y el Service Worker con interceptación `fetch`.
- Definir la caché de los recursos esenciales y demostrarla con Lighthouse.
- Probar la instalación en Chrome para Android y Safari para iOS.
- Mantener fuera de esa fase el modelo definitivo de reportes, la autenticación y la cola de sincronización, salvo una nueva especificación.

## Registro de la fase 1

Fecha de cierre de la preparación: 2026-10-26.

## Hecho

- Monorepo pnpm 12.15.0 y Turborepo 2.11.10 con `apps/web`, `apps/api`, paquetes compartidos y reserva `apps/mobile`.
- Contrato de `GET /health` y cuerpo de error, cumplido por Fastify y descrito en `docs/architecture/openapi.yaml`.
- Pantalla inicial que declara que los reportes, el offline y la sincronización no están implementados.
- Requisitos de la actividad separados de las decisiones técnicas. ADR 001 a 009 escritos.
- Reglas de Cursor en `.cursor/rules/` y 25 skills en `.agents/skills/`.
- PostgreSQL documentado sin Docker y sin crear bases ni roles.

## Entorno observado

| Herramienta | Resultado                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js     | 22.14.0                                                                                                                                     |
| npm         | 10.9.2                                                                                                                                      |
| Git         | 2.47.1.windows.2. No había repositorio; `git init -b main` creó uno vacío                                                                   |
| pnpm        | No estaba en el `PATH`. Quedó 12.15.0 en `C:\Users\unixc\AppData\Roaming\npm`                                                               |
| Corepack    | 0.31.0. `corepack pnpm` falla: busca `bin/pnpm.cjs` y pnpm 12 publica `bin/pnpm.mjs`. Corepack 0.36.0 exige Node `^22.22.2` y no se instaló |
| PostgreSQL  | 18.2. Servicio `postgresql-x64-18` en ejecución. Cliente en `C:\Program Files\PostgreSQL\18\bin\psql.exe`, fuera del `PATH`                 |
| Docker      | 29.3.0 instalado. No se usó y el repositorio no contiene `Dockerfile` ni `docker-compose.yml`                                               |

## Comandos y resultados

Todos se ejecutaron en `C:\Users\unixc\Desktop\AppWeb` el 2026-10-26. El código de salida fue 0 salvo donde se indica.

| Comando                                 | Resultado                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                          | Completó. `esbuild@0.28.2` ejecutó su postinstall permitido. Aviso de peer corregido al bajar TypeScript de 7.0.2 a 6.0.3. Aviso de subdependencia deprecada: `whatwg-encoding@3.1.1`, arrastrada por jsdom 26 |
| `pnpm peers check`                      | Sin problemas después del cambio a TypeScript 6.0.3                                                                                                                                                            |
| `pnpm typecheck`                        | 6 tareas correctas                                                                                                                                                                                             |
| `pnpm lint`                             | ESLint sin errores                                                                                                                                                                                             |
| `pnpm format:check`                     | Falló una vez por formato y quedó en verde después de `pnpm format`                                                                                                                                            |
| `pnpm --filter @field-service/api test` | 7 pruebas correctas                                                                                                                                                                                            |
| `pnpm --filter @field-service/web test` | 1 prueba correcta                                                                                                                                                                                              |
| `pnpm test`                             | Las tres tareas de Turbo correctas                                                                                                                                                                             |
| `pnpm build`                            | Contratos, API y web. Vite 8.3.5 emitió CSS de 6.02 kB y JS de 220.27 kB                                                                                                                                       |
| `pnpm audit --audit-level=high`         | No known vulnerabilities found                                                                                                                                                                                 |
| `node apps/api/dist/server.js`          | Escuchó en `http://127.0.0.1:3000`. El log dijo `databaseConfigured: false` y no imprimió una URL                                                                                                              |
| `GET /health`                           | 200 y `{"status":"ok","service":"field-service-api"}`. Helmet y `x-ratelimit-limit: 300` presentes                                                                                                             |
| `GET /missing`                          | 404 y `{"error":{"code":"NOT_FOUND","message":"Route not found"}}`                                                                                                                                             |
| `pnpm --filter @field-service/web dev`  | Vite listo en `http://127.0.0.1:5173/`. El módulo servido contiene el título y el aviso de que el offline no existe. El CSS respondió 200                                                                      |

Los dos servidores se detuvieron al terminar la comprobación.

## Verificación que no pudo ejecutarse

El navegador del IDE (`cursor-ide-browser`) respondió `Server not found`. No hay una pasada visual ni de viewport. La pantalla sí quedó cubierta por la prueba de Testing Library y por el módulo que Vite entregó en caliente.

El workflow `.github/workflows/ci.yml` no se ha ejecutado en GitHub: no hay remoto ni commit.

En el cierre del Sprint 1 no existía `render.yaml`. El 2026-10-27 se añadió para un solo servicio y sigue sin aplicarse.

## Revisión antes de cerrar

- Corrección: la sonda y el 404 coinciden con el OpenAPI manual. El entorno rechaza el puerto 70000.
- Legibilidad: el arranque, la seguridad y los errores están en archivos separados y cortos.
- Arquitectura de la fase 1: la web no dependía de la API. `disallowWorkspaceCycles` está activo. Drizzle se instaló después, en la fase 2.
- Seguridad: no hay `.env` ni secretos. El cuerpo de error no devuelve la excepción. Los scripts de instalación siguen bloqueados excepto `esbuild`.
- Rendimiento: no hay consultas ni listas. La primera ejecución de la prueba HTTP tardó unos 3,5 s; la repetición del archivo tardó 575 ms. No se optimizó.

Helmet envía `Strict-Transport-Security` también en HTTP local. Es el valor por defecto del plugin y no se desactivó. Puede afectar a un navegador que recuerde esa política para `127.0.0.1`.

## Decisiones que siguen abiertas

1. Crear el commit inicial y el remoto de GitHub.
2. Plan, región y nombres de Render antes de escribir `render.yaml`.
   Estas decisiones abiertas de la fase 1 quedan resumidas en la sección de la fase 2. La instalación de Drizzle y la migración generada ya ocurrieron. Su aplicación contra PostgreSQL 18 continúa pendiente.
