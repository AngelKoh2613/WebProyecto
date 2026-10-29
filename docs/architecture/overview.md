# Arquitectura

Aplicación web progresiva para técnicos de campo. El navegador guarda el reporte en IndexedDB y el servidor lo confirma en PostgreSQL. La sincronización y sus límites están en ADR-006.

## Por qué una PWA

El técnico trabaja en zonas donde la red falla y usa un teléfono Android o iOS. Una página que solo existe mientras hay conexión pierde el reporte en el momento en que el trabajo lo necesita. La PWA guarda el reporte en el dispositivo y lo reintenta cuando la API responde y la página está abierta.

Esa capacidad todavía no está verificada. Las limitaciones dependen del navegador y de la versión del sistema: Chrome para Android y Safari para iOS no instalan igual, y WebKit puede desalojar el almacenamiento. La comparación con la web tradicional, la API sin cliente, la aplicación nativa y la multiplataforma está en [decision-matrix.md](decision-matrix.md). La API es el canal de confirmación, no la interfaz de campo.

Lo que exige la actividad, lo que el proyecto decidió y lo que sigue sin validar quedan separados en [browser-compatibility.md](browser-compatibility.md) y en [sprint-1-evidence.md](../testing/sprint-1-evidence.md).

## Componentes

```text
Navegador (apps/web)
  React + Vite
  IndexedDB, cola de reportes y pantalla de sincronización
        |
        | HTTPS, REST JSON, en el despliegue
        v
API (apps/api)
  Fastify
  Sin autenticación. Alta idempotente de reportes
        |
        | DATABASE_URL abre un pool solo cuando la variable existe
        v
PostgreSQL 18 local o PostgreSQL administrado en Render
```

`@field-service/contracts` es el canal de tipos compartidos. `@field-service/validation` contiene los esquemas Zod de las respuestas iniciales. `@field-service/domain` sigue reservado y no contiene reglas. `@field-service/config` marca el lugar de la configuración compartida; ESLint y TypeScript siguen en la raíz por la resolución de cada herramienta.

## Responsabilidades

| Módulo                | Responsabilidad actual                          | Fuera de su límite                       |
| --------------------- | ----------------------------------------------- | ---------------------------------------- |
| `apps/web`            | Interfaz, IndexedDB y cola de sincronización    | Acceso a PostgreSQL, importar `apps/api` |
| `apps/api`            | HTTP, salud, reportes idempotentes y pool       | Pantallas e IndexedDB                    |
| `packages/contracts`  | Salud, errores y el cuerpo del reporte          | Reglas de persistencia                   |
| `packages/validation` | Esquemas Zod de esas respuestas                 | Configuración solo del servidor          |
| `packages/domain`     | Reglas independientes de frameworks             | Tipos de infraestructura                 |
| `database`            | Migraciones aditivas de comprobación y reportes | Aplicarlas al arrancar la API            |
| `apps/mobile`         | Reserva para Capacitor                          | Proyecto nativo en esta fase             |

## Flujo previsto

1. El técnico usa la PWA instalada o el sitio HTTPS.
2. Con red, la web llama a la API REST.
3. La API valida la entrada, aplica la regla de negocio y persiste en PostgreSQL.
4. Sin red, la web lee y escribe IndexedDB.
5. Al volver la red, una cola local reintenta los cambios pendientes de forma idempotente.

Ese flujo está construido para un alta. No hay edición remota ni cuentas de usuario. Al haber red, el dispositivo también baja los reportes ya confirmados en el servidor. La pantalla también consulta `GET /health` y `GET /health/ready`.

## Límites

- El navegador no recibe la cadena `DATABASE_URL` ni habla con PostgreSQL.
- La API no importa React ni componentes visuales.
- Los paquetes compartidos no importan `apps/web` ni `apps/api`.
- Un reporte confirmado solo existirá después de que el servidor lo acepte. La copia local será provisional.

## PWA

El manifiesto, los iconos y un Service Worker de Workbox cubren la interfaz. La estrategia y sus límites están en ADR-005. La instalación en un teléfono sigue sin comprobarse. El HTTPS público respondió el 2026-10-29. Los reportes locales no dependen de esa caché: viven en IndexedDB.

Los archivos están en `apps/web/public/manifest.webmanifest` y `apps/web/public/icons/`. `index.html` enlaza el manifiesto. La comparación por sistema está en [browser-compatibility.md](browser-compatibility.md) y el checklist en [pwa-installation-checklist.md](../testing/pwa-installation-checklist.md).

Vite sirve el frontend por HTTP en `127.0.0.1:5173`. Un túnel HTTPS de prueba está descrito en [https-tunnel.md](../testing/https-tunnel.md) y no se ejecutó. El TLS del despliegue corresponde a Render.

## Datos offline y sincronización

ADR-006 fija IndexedDB mediante Dexie.js, los estados locales y la cola. Cache Storage, vía Workbox, guarda el shell de la interfaz y no los reportes.

`clientId` es la clave de idempotencia. PostgreSQL la impone con un índice único y una inserción que no pisa una fila distinta. El reintento, los conflictos y el límite de iOS están en ese ADR. La prueba manual está en `docs/testing/strategy.md`.

## Despliegue

En producción, Fastify sirve la API y el build de React desde el mismo proceso. Vite solo se usa en desarrollo. ADR-010 fija esa forma y sustituye la publicación en dos servicios de ADR-007. `render.yaml` describe un servicio web con plan `free`, sin base de datos nueva. Ese blueprint no se aplicó. El servicio creado en el panel está en `https://webproyecto.onrender.com`. El detalle está en `docs/deployment/render.md`.

## Fuentes de las decisiones

Los ADR de `docs/architecture/decisions/` registran el porqué. Si esta descripción y un ADR se contradicen, manda el ADR más reciente y esta página debe actualizarse en el mismo cambio.
