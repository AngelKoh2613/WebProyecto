# Evidencias del Sprint 1

Fecha: 2026-10-26.

Los estados significan:

- Preparado: existe documentación o configuración para continuar.
- Implementado: el código hace la función, aunque falte una prueba externa.
- Verificado: una ejecución real produjo el resultado indicado.
- Pendiente: no está hecho o no pudo comprobarse.

Documentar una arquitectura no verifica la instalación ni el modo offline.

| Requisito                  | Estado     | Método de verificación                        | Evidencia                                                          | Observaciones                                                                                       |
| -------------------------- | ---------- | --------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Arquitectura justificada   | Verificado | Revisión del documento y de los ADR           | `docs/architecture/overview.md`, ADR 001 a 009                     | La justificación de la PWA y sus límites están escritos. La PWA no está construida.                 |
| Matriz de decisión         | Verificado | Revisión documental                           | `docs/architecture/decision-matrix.md`                             | Las puntuaciones son un juicio explicado. No son mediciones de dispositivos.                        |
| Compatibilidad documentada | Verificado | Fuentes oficiales consultadas el 2026-10-26   | `docs/architecture/browser-compatibility.md`                       | No incluye prueba en Android ni en iOS.                                                             |
| Entorno local              | Verificado | Ejecución del 2026-10-27                      | Comandos registrados abajo                                         | Node.js 22.14.0, pnpm 12.15.0, Git 2.47.1. `typecheck`, `lint`, `test` y `build` terminaron bien.   |
| HTTPS de prueba            | Pendiente  | El procedimiento está escrito; el túnel no    | `docs/testing/https-tunnel.md`                                     | No hay `ngrok`, `cloudflared` ni `lt`. No hay capturas HTTPS. No se fabricaron imágenes.            |
| API REST                   | Verificado | Solicitud HTTP a `http://127.0.0.1:3000`      | Respuestas del 2026-10-27, registradas abajo                       | El proceso compilado usó la base configurada y se detuvo. La consulta es HTTP local, no HTTPS.      |
| PostgreSQL                 | Verificado | Conexión real y migración aditiva             | Base `appweb_ykvs`, PostgreSQL 18.6, tabla `infrastructure_checks` | La prueba de integración insertó una fila y la borró. Quedan 0 filas.                               |
| Instalación PWA            | Parcial    | Manifiesto, iconos y Service Worker del shell | `docs/testing/pwa-installation-checklist.md`                       | La fase 1 del Sprint 2 añadió el shell. No hay prueba en un teléfono ni HTTPS público.              |
| Funcionamiento offline     | Parcial    | Precaché de la interfaz                       | La pantalla distingue la red, el servidor y el shell cacheado      | El shell no guardaba reportes. La fase 2 del Sprint 2 añadió IndexedDB; esta fila no es esa prueba. |

## Cierre del 2026-10-27

La base provisionada `appweb_ykvs` aceptó la conexión. `pnpm --filter @field-service/api db:migrate` aplicó `0000_create_infrastructure_checks.sql`. El esquema quedó con `id` uuid, `note` text y `created_at` timestamptz. El historial de Drizzle tiene una fila. No se ejecutó `DROP`, `TRUNCATE` ni borrado de datos ajenos.

`node --env-file=.env apps/api/dist/server.js` respondió y el proceso se detuvo:

```text
GET /health
200
{"status":"ok","service":"field-service-api"}

GET /health/ready
200
{"status":"ready","checks":{"database":"up"}}

GET /api/v1
200
{"service":"field-service-api","version":"v1","status":"initial"}

GET /missing
404
{"error":{"code":"NOT_FOUND","message":"Route not found"}}
```

Con `Origin: http://127.0.0.1:5173`, la respuesta no trajo `Access-Control-Allow-Origin`. `CORS_ORIGIN` sigue vacío.

| Comando                         | Resultado                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                | 7 tareas correctas                                                                                                                                                           |
| `pnpm lint`                     | Sin errores                                                                                                                                                                  |
| `pnpm test`                     | API: 23 correctas, 0 omitidas. Web: 3 correctas. La integración real tardó 7801 ms                                                                                           |
| `pnpm build`                    | Correcto. Vite emitió CSS de 6.86 kB y JS de 510.53 kB                                                                                                                       |
| `pnpm audit --audit-level=high` | Código 0                                                                                                                                                                     |
| `pnpm audit`                    | Código 1. Una vulnerabilidad moderada: `esbuild` `<=0.24.2`, arrastrado por `drizzle-kit` a través de `@esbuild-kit`. No está en el proceso de la API ni en el build de Vite |

Git local sigue en `main`, sin commits y sin remoto. `.env` está ignorado. `.env.example` solo tiene `USER` y `PASSWORD`.

## API consultada sin base, el 2026-10-26

Proceso: `node apps/api/dist/server.js`, sin `DATABASE_URL`, en `127.0.0.1:3000`. El proceso se detuvo al terminar. El log no contenía `postgresql://`.

```text
GET /health
200
{"status":"ok","service":"field-service-api"}

GET /health/ready
503
{"status":"not_ready","checks":{"database":"not_configured"}}

GET /api/v1
200
{"service":"field-service-api","version":"v1","status":"initial"}
```

Una petición a `/health` con el encabezado `Origin: http://127.0.0.1:5173` no devolvió `Access-Control-Allow-Origin`. Ese es el comportamiento previsto cuando `CORS_ORIGIN` está vacío. En desarrollo, Vite reenvía `/health` y `/api`, así que el navegador no necesita CORS para la prueba local.

## Capturas

No hay capturas de HTTPS ni de teléfonos. Crear una imagen simulada incumpliría el cierre del sprint.

## Servicio único, 2026-10-27

Fastify sirve el build de React cuando `NODE_ENV=production`. No se publicó nada y no hay URL HTTPS.

| Comando          | Resultado                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `pnpm lint`      | Sin errores                                                                                   |
| `pnpm typecheck` | 7 tareas correctas                                                                            |
| `pnpm test`      | API: 28 correctas, 0 omitidas, incluida la integración real con PostgreSQL. Web: 4 correctas  |
| `pnpm build`     | Correcto. Vite emitió CSS de 16.96 kB y JS de 531.52 kB. El paquete no contiene una URL local |

El proceso `node apps/api/dist/server.js` se arrancó con `NODE_ENV=production` desde un directorio distinto a la raíz, en `127.0.0.1:3011`, y se detuvo después de estas respuestas:

```text
GET /            200  HTML
GET /health      200  {"status":"ok","service":"field-service-api"}
GET /health/ready 200 {"status":"ready","checks":{"database":"up"}}
GET /api/v1      200  {"service":"field-service-api","version":"v1","status":"initial"}
GET /api/missing 404  JSON NOT_FOUND
GET /mis-reportes 200 HTML
```

El log indicó `databaseConfigured: true` y `corsEnabled: false`. No contenía `postgresql://`.

## Docker

No se utilizó. El repositorio no contiene `Dockerfile` ni `docker-compose.yml`.
