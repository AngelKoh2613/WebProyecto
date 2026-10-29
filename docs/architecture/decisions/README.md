# Decisiones de arquitectura

Los ADR viven en `docs/architecture/decisions/` porque el encargo de la fase 1 fijó esa ruta. La skill `documentation-and-adrs` propone por defecto `docs/decisions/`. No hay una convención previa en el repositorio; se sigue la ruta del encargo y no se mantienen dos series.

| ADR                                               | Decisión                          | Estado                                                             |
| ------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| [ADR-001](ADR-001-react-typescript-vite.md)       | React, TypeScript y Vite          | Aceptado                                                           |
| [ADR-002](ADR-002-pnpm-turborepo.md)              | Monorepo con pnpm y Turborepo     | Aceptado, sujeto a la verificación registrada en el estado de fase |
| [ADR-003](ADR-003-fastify-rest.md)                | Node.js, Fastify y API REST       | Aceptado para el transporte; el dominio queda pendiente            |
| [ADR-004](ADR-004-postgresql-and-drizzle.md)      | PostgreSQL y Drizzle ORM          | Migración técnica aplicada en la base de desarrollo                |
| [ADR-005](ADR-005-pwa-service-worker.md)          | PWA y Service Worker              | Aceptado para la interfaz. Los reportes locales están en ADR-006   |
| [ADR-006](ADR-006-indexeddb-local-persistence.md) | IndexedDB para persistencia local | Aceptado. Cola local y alta idempotente en PostgreSQL              |
| [ADR-007](ADR-007-render-deployment.md)           | Render como plataforma            | Sustituido en la publicación por ADR-010                           |
| [ADR-008](ADR-008-docker-excluded.md)             | Docker excluido                   | Aceptado                                                           |
| [ADR-009](ADR-009-capacitor-future-extension.md)  | Capacitor como extensión futura   | Aceptado                                                           |
| [ADR-010](ADR-010-single-service-render.md)       | Un solo servicio web              | Aceptado como forma de ejecución; sin despliegue                   |

Una decisión pasa de propuesta a aceptada cuando el equipo la confirma y, si implica una herramienta, cuando una verificación del repositorio demuestra que funciona. No se borra un ADR sustituido: se escribe otro que lo referencie.
