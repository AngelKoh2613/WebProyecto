# Estrategia de pruebas

## Qué se prueba ahora

| Área              | Herramienta                    | Comando                                                   | Qué demuestra                                                                                                                                                                     |
| ----------------- | ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entorno de la API | Vitest                         | `pnpm --filter @field-service/api test`                   | Valores por defecto, prioridad de `API_HOST` y `API_PORT`, y rechazo de un puerto, un secreto o un origen `*`                                                                     |
| HTTP de la API    | Vitest y `app.inject`          | el mismo comando                                          | `GET /health`, `GET /health/ready`, `GET /api/v1`, CORS y el cuerpo de error 404                                                                                                  |
| Disponibilidad    | Dobles de `DatabaseProbe`      | el mismo comando                                          | 503 `not_configured`, 503 `down` y 200 `ready`. Estos dobles no sustituyen una conexión a PostgreSQL                                                                              |
| Migración         | Lectura del SQL versionado     | el mismo comando                                          | El SQL crea `infrastructure_checks` y no contiene `DROP`, `TRUNCATE` ni `DELETE FROM`                                                                                             |
| PostgreSQL real   | Vitest y la base identificada  | el mismo comando, si `.env` apunta a un destino permitido | Aplica las migraciones si faltan, lee una fila técnica y comprueba que repetir un `client_id` deja una sola fila de reporte. Borra solo esas filas                                |
| Reportes HTTP     | Vitest y `app.inject`          | el mismo comando                                          | 400, 201, 200, 409, 404 y 503. El doble en memoria no sustituye la prueba de PostgreSQL                                                                                           |
| Reportes locales  | Vitest y `fake-indexeddb`      | `pnpm --filter @field-service/web test`                   | Alta, reapertura de la base, fallo de red, borrador y cola. No es una prueba en un teléfono                                                                                       |
| Pantalla inicial  | Vitest, Testing Library, jsdom | el mismo comando                                          | La pantalla distingue la red, el servidor y el texto de guardado local                                                                                                            |
| Extremo a extremo | Edge en modo headless          | `pnpm e2e`                                                | Build de producción: alta, IndexedDB, corte de red simulado, reapertura, sincronización, repetición y fallo temporal. Requiere Edge y la base de desarrollo. No forma parte de CI |
| Tipos             | `tsc --noEmit`                 | `pnpm typecheck`                                          | El TypeScript estricto compila                                                                                                                                                    |
| Build             | Turbo                          | `pnpm build`                                              | La API emite `dist/` y Vite genera el frontend                                                                                                                                    |

Estas pruebas no cubren autenticación, instalación en un teléfono ni un corte de la radio del dispositivo. La red se simula en Vitest y, en `pnpm e2e`, con la red emulada de Edge.

## Prueba manual de un reporte

1. Arrancar la API y la web.
2. Abrir Mis reportes, escribir una descripción y pulsar Guardar reporte. El aviso debe decir que quedó en el dispositivo. El estado es pendiente o, si la API responde, sincronizado.
3. Recargar la página. El mismo reporte sigue en la lista.
4. En las herramientas del navegador, poner la red en offline, crear otro reporte y comprobar que permanece pendiente. Volver a online y pulsar Reintentar sincronización. Solo pasa a sincronizado si la respuesta del servidor es válida.
5. Repetir el `POST` con el mismo `clientId` y el mismo cuerpo. Debe haber una sola fila en `service_reports`.

No se hizo esta prueba en Android ni en iOS.

## Qué queda fuera

- La prueba de integración con PostgreSQL se ejecuta cuando `.env` apunta a un destino de desarrollo identificado. Si no hay ese archivo, queda omitida. No se simula el resultado.
- Playwright o un dispositivo real. Corresponden a REQ-14.
- Lighthouse. Corresponde a REQ-13, cuando existan manifiesto y Service Worker.
- Umbral de cobertura. No se fija un porcentaje sin una decisión del equipo.

## Criterio

Una tarea de comportamiento lleva una prueba que falla si se quita la conducta esperada. Una tarea de documentación se verifica comprobando que las rutas y los comandos citados existen. Una sonda con un doble se identifica como tal cuando el informe habla de PostgreSQL.
