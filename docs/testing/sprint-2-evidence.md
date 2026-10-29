# Evidencias del Sprint 2

Fecha local: 2026-10-27. Entorno: Windows, Node.js 22.14.0, pnpm 12.15.0, Edge headless. La base de desarrollo identificada respondió. El 2026-10-29 se mostró el panel de Lighthouse de la URL pública; esa imagen no está en el repositorio.

El Sprint 2 está implementado y las pruebas automatizadas de esta página pasaron. No está validado por completo. Faltan Android e iOS. La URL HTTPS pública respondió el 2026-10-29.

## Matriz

| Criterio                                       | Evidencia                                                                                                                | Resultado                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Alta de un reporte válido                      | `pnpm e2e` guarda la descripción y espera el aviso de guardado local                                                     | Aprobado el 2026-10-27                                                                          |
| El reporte queda en IndexedDB                  | La misma prueba lee el almacén `reports` de la base `field-service`                                                      | Aprobado                                                                                        |
| Otro reporte sin red queda pendiente           | Edge emula la red cortada. El estado local es `pending`                                                                  | Aprobado. No es un corte de radio en un teléfono                                                |
| Cierre y reapertura                            | Se cierra Edge y se vuelve a abrir el mismo perfil, todavía sin red                                                      | El pendiente sigue en Mis reportes                                                              |
| Sincronización al volver la red                | Se levanta la emulación y la interfaz pasa a «Sincronizado»                                                              | Aprobado                                                                                        |
| PostgreSQL conserva una fila por identificador | Conteos `1, 1, 1` para los tres `clientId` de la prueba                                                                  | Aprobado. Esas filas se borraron al terminar                                                    |
| La interfaz muestra el estado real             | El texto del elemento es «Sincronizado» solo después de la respuesta                                                     | Aprobado                                                                                        |
| Repetir el mismo cuerpo no duplica             | El segundo `POST` respondió 200 y el conteo siguió en 1                                                                  | Aprobado                                                                                        |
| Un fallo temporal no borra el reporte          | Se detiene la API, el estado pasa a error y el texto sigue en el dispositivo. Al reiniciar, el reintento lo sincroniza   | Aprobado                                                                                        |
| Service Worker y caché                         | `GET /sw.js`, el manifiesto y el icono de 512 respondieron 200. Lighthouse 11.7.1 dio PWA 100 en `http://127.0.0.1:3012` | Aprobado en local. `127.0.0.1` es contexto seguro para el navegador; no sustituye HTTPS público |
| La API no cae en el fallback HTML              | `GET /api/missing` responde 404 JSON                                                                                     | Aprobado                                                                                        |
| Calidad del repositorio                        | Tabla de comandos de abajo                                                                                               | Aprobado, con las salvedades de auditoría                                                       |
| Lighthouse                                     | Tabla de puntuaciones                                                                                                    | Local el 2026-10-28. Público el 2026-10-29, en `https://webproyecto.onrender.com/`              |
| Android e iOS                                  | No hay dispositivo conectado a este entorno                                                                              | Pendiente manual                                                                                |
| Despliegue HTTPS                               | `https://webproyecto.onrender.com`, comprobado el 2026-10-29                                                             | En vivo. El blueprint no se aplicó; el servicio se creó en el panel                             |

## Comandos

| Comando                         | Resultado                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                     | Sin avisos                                                                                                                                                        |
| `pnpm format:check`             | Sin diferencias                                                                                                                                                   |
| `pnpm typecheck`                | 7 tareas correctas                                                                                                                                                |
| `pnpm test`                     | API: 34 correctas, 0 fallidas, 0 omitidas, incluida la integración con PostgreSQL. Web: 22 correctas, 0 fallidas, 0 omitidas                                      |
| `pnpm e2e`                      | Una ejecución correcta: tres reportes, repetición 200, una fila por identificador. Edge headless contra el build de producción                                    |
| `pnpm build`                    | Web: CSS 18.56 kB, JS 653.47 kB (gzip 194.83 kB), precaché de 10 entradas, 662.79 KiB                                                                             |
| `pnpm audit --audit-level=high` | Sin avisos altos. Quedan una vulnerabilidad moderada de `esbuild` en `drizzle-kit` y una baja de `deepmerge` en la cadena de Workbox. No hay parche para esa baja |

`pnpm e2e` no está en CI. El ejecutor de GitHub no tiene Edge ni la base de desarrollo.

## Lighthouse

La primera tabla es `http://127.0.0.1:3012`, el build servido por Fastify. La segunda es el panel de DevTools sobre `https://webproyecto.onrender.com/`, a las 00:22 del 2026-10-29. Esa imagen no está guardada en el repositorio. El panel no muestra la versión de Lighthouse ni la categoría PWA.

| Herramienta                             | Categoría      | Puntuación                              |
| --------------------------------------- | -------------- | --------------------------------------- |
| Lighthouse 12.8.2, 2026-10-28T05:19:05Z | Performance    | 96                                      |
| Lighthouse 12.8.2                       | Accessibility  | 100                                     |
| Lighthouse 12.8.2                       | Best Practices | 96                                      |
| Lighthouse 12.8.2                       | SEO            | 100                                     |
| Lighthouse 12.8.2                       | PWA            | Esta versión ya no incluye la categoría |
| Lighthouse 11.7.1, 2026-10-28T05:19:25Z | PWA            | 100                                     |

Best Practices no llega a 100 por dos auditorías que se dejaron así:

- No se publican source maps del paquete de producción.
- DevTools anota la política `upgrade-insecure-requests` porque la auditoría usó HTTP. En un sitio HTTPS esa directiva coincide con el despliegue previsto. No se quitó Helmet para subir la puntuación.

Performance se queda en 96. La primera pintura fue 1.9 s y la más grande 2.5 s, con la limitación de red de Lighthouse. Sigue habiendo JavaScript no usado en la primera pantalla, unos 98 KiB. No se partió el paquete solo para perseguir 100.

Antes de comprimir las respuestas, Performance estaba en 71. `@fastify/compress` 8.1.0 comprime a partir de 1024 bytes. La navegación móvil desbordaba el ancho porque la barra de secciones no podía encogerse; Lighthouse 11 marcaba PWA 88 por eso. Con `min-w-0` la categoría PWA pasó a 100.

El 2026-10-29 el mismo panel, sobre la URL pública, marcó:

| Categoría      | Puntuación |
| -------------- | ---------- |
| Performance    | 97         |
| Accessibility  | 100        |
| Best Practices | 96         |
| SEO            | 100        |

Esa corrida avisó que IndexedDB ya tenía datos y que eso puede cambiar Performance. A la izquierda se veían reportes sincronizados, así que no fue una ventana de incógnito. El panel no dice qué auditoría dejó Best Practices en 96. El sitio público sigue en el build anterior: no incluye las cuentas ni el mapa de coordenadas.

## PostgreSQL

La migración `0001_create_service_reports.sql` ya estaba aplicada en la base de desarrollo. La prueba de integración y `pnpm e2e` escribieron filas de prueba y borraron solo esas filas. `GET /health/ready` formó parte del arranque usado por la prueba de extremo a extremo. No se ejecutó `DROP` ni `TRUNCATE`.

## HTTPS

El servicio `WebProyecto` está en vivo en `https://webproyecto.onrender.com`. El panel de Render mostró el primer despliegue como correcto el 2026-10-28 por la noche, hora local. `render.yaml` no se aplicó como blueprint: el servicio se creó con el formulario. El plan gratuito se apaga por inactividad y el primer acceso puede tardar cerca de un minuto.

Comprobación del 2026-10-29, 06:03 UTC, sin guardar capturas:

| Solicitud                   | Resultado                              |
| --------------------------- | -------------------------------------- |
| `GET /`                     | 200, HTML, con el enlace al manifiesto |
| `GET /health`               | 200, `status: ok`                      |
| `GET /health/ready`         | 200, `database: up`                    |
| `GET /api/v1`               | 200, versión `v1`                      |
| `GET /api/missing`          | 404 JSON, no HTML                      |
| `GET /mis-reportes`         | 200, el mismo HTML de la interfaz      |
| `GET /manifest.webmanifest` | 200, `application/manifest+json`       |
| `GET /sw.js`                | 200, JavaScript                        |

La respuesta incluye `strict-transport-security`. Quien usa el proyecto confirmó el 2026-10-29 que el instalador del teléfono ya funciona. No hay captura de esa pantalla en el repositorio.

## Seguridad

Cada reporte pertenece a una cuenta. La sesión va en la cookie `fs_session`, HttpOnly y SameSite=Lax. La contraseña se guarda con scrypt y no se escribe en el registro. `GET /api/v1/reports` solo devuelve los reportes de esa sesión. Las entradas se validan en el cliente y en la API. `client_id` es único. Latitud y longitud son obligatorias en un alta nueva y pueden faltar en filas anteriores. CORS sigue cerrado si `CORS_ORIGIN` está vacío. Helmet envía la política de contenido, con las teselas de OpenStreetMap en `img-src`, `nosniff` y el resto de sus cabeceras por defecto. Los logs de error no incluyen el cuerpo ni la cadena de conexión. El Service Worker no cachea `/api` ni `/health`. Si IndexedDB rechaza la cuota, el reporte no se da por guardado y el mensaje dice que no hay espacio.

`@fastify/static` quedó en 10.1.8 por el aviso de salto de ruta corregido en esa serie. La prueba de cliente sigue rechazando `../` fuera del build.

## Android

Pendiente. La URL pública ya existe:

1. Abrir `https://webproyecto.onrender.com` en Chrome.
2. Instalar o añadir a la pantalla de inicio.
3. Abrir la ventana independiente.
4. Crear un reporte, cerrar la aplicación y comprobar que sigue.
5. Activar el modo avión, crear otro y comprobar que queda pendiente.
6. Quitar el modo avión, abrir la aplicación y comprobar que pasa a sincronizado.
7. Publicar un build nuevo y comprobar el aviso de actualización.

## iOS

Pendiente. En Safari, compartir y añadir a la pantalla de inicio. Cerrar la aplicación desde el conmutador y volver a abrirla. La sincronización tiene que ocurrir al abrirla o al pulsar Reintentar. No depende de Background Sync. Repetir el corte de red del apartado anterior.

## Defectos corregidos en esta fase

- Al recuperar la red, la aplicación no volvía a preguntar por la API, así que la cola automática no arrancaba. Ahora consulta `/health` al volver la red y al hacerse visible.
- La barra de secciones ensanchaba la página en un móvil de 412 px.
- Las respuestas grandes viajaban sin compresión.
- El README todavía decía que no había reportes ni Service Worker.
