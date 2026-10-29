# PostgreSQL

La base de datos del proyecto es PostgreSQL instalado en el sistema o el PostgreSQL administrado de Render. Docker no forma parte del flujo de desarrollo ni del despliegue.

## Estado en la fase 2

- El esquema provisional es la tabla técnica `infrastructure_checks`. Sirve para comprobar migraciones. No es un reporte de servicio.
- La migración `database/migrations/0000_create_infrastructure_checks.sql` está versionada y solo crea esa tabla. El 2026-10-27 se aplicó a la base de desarrollo `appweb_ykvs`. La tabla quedó con `id`, `note` y `created_at`. No se creó otro rol.
- La API abre un pool cuando `DATABASE_URL` está definida y lo cierra al detener Fastify.

## Entorno local comprobado

En el equipo usado el 2026-10-26:

- El servicio `postgresql-x64-18` estaba en ejecución.
- El cliente existe en `C:\Program Files\PostgreSQL\18\bin\psql.exe`.
- `psql` no está en el `PATH` de la sesión. La versión se comprobó con la ruta completa: PostgreSQL 18.2.
- `psql -w -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "select 1"` terminó con código 2 y el mensaje `fe_sendauth: no password supplied`.
- `DATABASE_URL`, `PGPASSWORD` y `PGPASSFILE` no estaban definidos. No se modificó el `PATH` global ni se creó una base de datos.

Para usar el cliente en una terminal, sin cambiar la configuración permanente del sistema:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

## Acceso local previsto

1. Crear, fuera de este repositorio y con autorización, un rol y la base vacía `field_service_dev`.
2. Copiar `.env.example` a `.env`.
3. Sustituir `USER` y `PASSWORD` en `DATABASE_URL`. El nombre de la base debe seguir siendo `field_service_dev`.
4. Aplicar la migración de forma explícita.
5. No commitear `.env`.

El URL de ejemplo es ilustrativo:

```text
postgresql://USER:PASSWORD@127.0.0.1:5432/field_service_dev
```

## Migraciones

Drizzle ORM y Drizzle Kit están instalados, según [ADR-004](../docs/architecture/decisions/ADR-004-postgresql-and-drizzle.md).

```bash
pnpm --filter @field-service/api db:generate
pnpm --filter @field-service/api db:migrate
```

`db:generate` no abre una conexión. `db:migrate` exige `DATABASE_URL` y solo acepta `field_service_dev` en local o `appweb_ykvs` en su host de desarrollo identificado. El arranque de la API no aplica migraciones. El tiempo de espera de la conexión es de 10 segundos para alcanzar el servidor remoto.

En Render, la API recibirá `DATABASE_URL` desde el PostgreSQL administrado. La conexión de producción suele exigir TLS. El nombre de esa base y el parámetro TLS se confirmarán durante el despliegue. El límite local de `field_service_dev` no debe apuntarse a producción sin revisarlo.
