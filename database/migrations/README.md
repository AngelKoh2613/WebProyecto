# Migraciones

`0000_create_infrastructure_checks.sql` crea la tabla técnica `infrastructure_checks`. Drizzle Kit la generó el 2026-10-26 y el archivo se renombró para que el nombre describa el cambio. El journal `meta/_journal.json` usa la etiqueta `0000_create_infrastructure_checks`.

La sentencia es un `CREATE TABLE`. No elimina tablas ni datos. El 2026-10-27 se aplicó con `pnpm --filter @field-service/api db:migrate` a la base de desarrollo identificada. El historial de Drizzle registró una migración.

`0001_create_service_reports.sql` crea `service_reports` y el índice único `service_reports_client_id_unique`. El journal usa la etiqueta `0001_create_service_reports`. No modifica `infrastructure_checks` y no contiene `DROP`, `TRUNCATE` ni `DELETE`.

El 2026-10-27, `node --env-file=../../.env ./node_modules/drizzle-kit/bin.cjs migrate`, ejecutado en `apps/api`, respondió que las migraciones se aplicaron. El destino era la base de desarrollo ya identificada. La prueba de integración repitió el mismo `client_id` y dejó una sola fila, que después borró. No se migró una base de producción.
