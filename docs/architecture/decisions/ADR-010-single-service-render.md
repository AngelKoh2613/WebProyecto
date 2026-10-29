# ADR-010: Un solo servicio web en Render

## Estado

Aceptado para la forma de ejecución. El despliegue público no se ha realizado.

## Fecha

2026-10-27

## Contexto

ADR-007 separaba el sitio de Vite y la API de Fastify. Ese corte exige dos URL HTTPS, `VITE_API_URL` en el build y `CORS_ORIGIN` en la API. El mismo origen basta: Fastify puede servir el build de React y las rutas de la API. PostgreSQL sigue fuera del proceso. El monorepo no cambia de paquetes.

La documentación de Render consultada el 2026-10-27 indica que un blueprint sin `plan` usa `0.5c-512mb`, un plan de pago. El plan `free` existe y es el que evita ese valor por defecto.

## Decisión

En producción, `NODE_ENV=production` hace que `apps/api/dist/server.js` sirva `apps/web/dist` con `@fastify/static` 8.3.0. La ruta del build se calcula desde el módulo compilado, no desde el directorio de trabajo. `/`, `/health`, `/health/ready` y `/api/v1` conviven. Una ruta de cliente como `/mis-reportes` recibe `index.html`. Una ruta bajo `/api` o `/health` que no existe sigue respondiendo 404 JSON.

`/api` y `/health` no pasan por el fallback HTML. Un archivo fuera de `apps/web/dist` no se sirve. Los dotfiles del directorio público se rechazan.

En desarrollo, Vite sigue en `127.0.0.1:5173` y reenvía `/health` y `/api` a Fastify. El proceso de desarrollo no sirve el build.

En producción, `HOST` y `PORT` mandan sobre `API_HOST` y `API_PORT`. Si `HOST` no está definido, el proceso escucha en `0.0.0.0`. `VITE_API_URL` vacío mantiene llamadas relativas. Si el build de producción viera una URL de `localhost` o `127.0.0.1`, Vite la sustituye por vacío y el build falla si el paquete generado aún la contiene.

CORS permanece desactivado cuando `CORS_ORIGIN` está vacío. El mismo origen no lo necesita. `*` sigue rechazado.

`render.yaml` describe un servicio web, el plan `free`, la sonda `/health` y `DATABASE_URL` como secreto que el panel debe pedir. No declara una base de datos. `autoDeployTrigger` queda en `off`. Aplicar el blueprint es una acción del usuario; este cambio no lo aplica.

La migración no corre al arrancar. `db:migrate` conserva la lista de destinos de desarrollo.

## Alternativas consideradas

### Mantener dos servicios

- Ventajas: el build de Vite y el de Fastify se publican por separado.
- Desventajas: dos orígenes, CORS y una URL de API incrustada en el build.
- Rechazado para este despliegue: ADR-007 lo deja sustituido en esa parte.

### Copiar el build de React dentro de `apps/api`

- Ventajas: el proceso tendría el HTML junto al servidor.
- Desventajas: duplica el artefacto y rompe el límite de que la API no importa la web.
- Rechazado: Fastify solo lee el directorio ya compilado.

## Consecuencias

- Un despliegue correcto comparte origen. HTTPS lo termina Render cuando el servicio exista. Esta decisión no comprueba esa URL.
- El arranque de producción exige `pnpm build` previo. Sin `apps/web/dist/index.html` el proceso se detiene.
- Este ADR no define la PWA. El manifiesto y el Service Worker de la interfaz están en ADR-005. La sincronización de reportes no forma parte de ninguno de los dos.
