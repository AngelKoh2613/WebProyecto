# ADR-006: IndexedDB para persistencia local

## Estado

Aceptado

## Fecha

2026-10-26. Actualizado el 2026-10-27, cuando se implementó la copia local y la sincronización.

## Contexto

Un técnico debe poder registrar y consultar reportes sin conexión y sincronizarlos al recuperar la red. `localStorage` no ofrece transacciones ni capacidad adecuada para reportes con fotos u otros adjuntos futuros. El encargo señala Dexie.js como acceso previsto a IndexedDB.

No hay autenticación. Inventar un usuario o listar todos los reportes de la base compartida expondría registros de otras personas.

## Decisión

`apps/web` guarda los reportes en IndexedDB con Dexie 4.2.1. La base se llama `field-service`, versión 1, y tiene el almacén `reports`. La clave es `clientId`. También hay índices por `syncStatus` y `createdAt`. Una versión nueva de ese esquema deberá añadirse con `version(n)` de Dexie, sin borrar el almacén de los reportes pendientes.

Cada reporte local tiene `clientId`, `description`, `technicianLabel`, `createdAt`, `updatedAt`, `syncStatus`, `remoteId`, `syncedAt`, `errorMessage`, `attemptCount` y `nextAttemptAt`. `technicianLabel` es opcional y no comprueba la identidad de nadie. No hay fotos ni un estado operativo del servicio. El estado de sincronización es solo local: `draft`, `pending`, `syncing`, `synced` o `error`.

Solo un borrador puede modificarse. Un reporte pendiente, sincronizado o con error conserva la descripción con la que se envió. Si esa copia ya no coincide con el servidor, la API responde 409 y la copia local permanece.

PostgreSQL guarda la copia confirmada en `service_reports`. La migración aditiva es `0001_create_service_reports.sql`. `client_id` tiene un índice único. La inserción usa `ON CONFLICT (client_id) DO NOTHING` y después lee la fila. El mismo cuerpo devuelve 200. Un cuerpo distinto con el mismo identificador devuelve 409 y no sustituye la fila. La primera inserción devuelve 201.

`POST /api/v1/reports` sincroniza un reporte. `GET /api/v1/reports/:clientId` consulta uno. No hay un listado de todos los reportes. Sin autenticación, el UUID del cliente es el alcance de acceso de esta fase académica. No es una autorización de usuario.

La cola vive en el mismo almacén. Se procesa al abrir la aplicación, cuando la página vuelve a ser visible, cuando el navegador informa que hay red, con un temporizador para el próximo intento y con el botón de reintento. No usa Background Sync. Como máximo hay un envío de la cola a la vez. Un fallo no descarta el reporte ni detiene los demás. Hay cinco intentos automáticos, con espera de 2 segundos que se duplica hasta cinco minutos. Se reintenta ante un fallo de red o ante HTTP 408, 429 o 500 o superior. Un 409 u otro 4xx no se reintenta solo. El reintento manual vuelve a poner el contador en cero. Un reporte solo pasa a `synced` cuando la respuesta 200 o 201 valida el identificador remoto.

`navigator.onLine` no demuestra que la API responda. La interfaz separa «Sin conexión», «El servidor no responde», «Listo para sincronizar» y «Sincronización en curso». Guardar en el dispositivo no se presenta como un envío confirmado.

## Alternativas consideradas

### localStorage

- Ventajas: API pequeña.
- Desventajas: almacenamiento síncrono, sin índices y fácil de bloquear con un reporte grande.
- Rechazado para los reportes.

### Cache Storage como base de datos

- Ventajas: ya participa en la PWA.
- Desventajas: está pensado para respuestas HTTP, no para registros editables.
- Rechazado como almacén de reportes. La Cache Storage queda reservada a los recursos estáticos de ADR-005.

### Background Sync

- Ventajas: Chrome puede reintentar con la página cerrada.
- Desventajas: Safari en iOS no lo ofrece y el sistema puede terminar el proceso.
- Rechazado como garantía. El reintento ocurre con la aplicación abierta.

## Consecuencias

- Cerrar y volver a abrir la aplicación conserva los reportes locales, dentro de la cuota del navegador. Un `QuotaExceededError` informa que no hay espacio y no borra lo ya guardado.
- iOS puede suspender la página. La sincronización no está garantizada en segundo plano.
- WebKit puede desalojar almacenamiento. No se llama a `navigator.storage.persist()`.
- La instalación en un teléfono, Lighthouse y el despliegue público siguen fuera de esta decisión.
- No se guardan tokens de sesión en IndexedDB ni en `localStorage`.
