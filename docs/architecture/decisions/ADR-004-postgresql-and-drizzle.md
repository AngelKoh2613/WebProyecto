# ADR-004: PostgreSQL y Drizzle ORM

## Estado

Aceptado para la base de desarrollo. La migración `infrastructure_checks` se aplicó el 2026-10-27 a `appweb_ykvs`. Una base con otro nombre u otro host sigue rechazada.

## Fecha

2026-10-26

## Contexto

Los reportes confirmados en el servidor necesitan una base relacional. El encargo fija PostgreSQL sin Docker y propone Drizzle ORM si su configuración resulta compatible. En el entorno hay PostgreSQL 18.2, con el servicio `postgresql-x64-18` en ejecución, pero `psql` no está en el `PATH`. No hay autorización para crear roles ni bases.

## Decisión

PostgreSQL es el motor aceptado para el desarrollo local y para la base administrada de Render. La aplicación lee `DATABASE_URL` desde el entorno.

En la fase 2 se instalaron Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 y el driver `pg`. El esquema provisional es la tabla técnica `infrastructure_checks`, con `id`, `note` y `created_at`. No representa un reporte de servicio. Drizzle Kit generó `database/migrations/0000_create_infrastructure_checks.sql`, un `CREATE TABLE` aditivo. Esa migración no se aplicó: no hay `DATABASE_URL` ni contraseña de PostgreSQL en el entorno, y `psql -w` responde `fe_sendauth: no password supplied`.

`pnpm --filter @field-service/api db:migrate` exige `DATABASE_URL` y solo acepta dos destinos identificados: la base local `field_service_dev` en `127.0.0.1` o `localhost`, y la base de desarrollo `appweb_ykvs` en su host de Render ya comprobado. Cualquier otro nombre u host se rechaza. El arranque de la API no migra. Si la variable falta, el proceso escucha y `GET /health/ready` responde 503 con `not_configured`. Si está presente y el ping falla, responde 503 con `down` y el log solo registra que la comprobación falló. Si el ping funciona, responde 200 con `up`.

## Alternativas consideradas

### Prisma

- Ventajas: migraciones y cliente muy extendidos.
- Desventajas: no es la herramienta pedida y su motor de consulta añade un proceso propio.
- Rechazado mientras Drizzle siga siendo viable.

### Consultas SQL sin ORM

- Ventajas: menos dependencias y control total del SQL.
- Desventajas: el encargo propone Drizzle para mantener el esquema tipado junto al resto de TypeScript.
- Aplazado: se reconsiderará solo si Drizzle no puede generar migraciones contra PostgreSQL 18.

### Docker para Postgres

- Rechazado: lo prohíbe ADR-008.

## Consecuencias

- La migración `0000_create_infrastructure_checks` se aplicó el 2026-10-27 a la base de desarrollo identificada. No se aplicó a ninguna otra base.
- Aplicarla, crear el rol y crear esa base siguen pendientes de credenciales y de autorización.
- El estado propuesto se mantiene hasta esa aplicación. PostgreSQL como motor no vuelve a discutirse salvo un cambio de encargo.
