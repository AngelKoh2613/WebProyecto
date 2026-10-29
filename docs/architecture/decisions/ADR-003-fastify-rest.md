# ADR-003: Node.js, Fastify y API REST

## Estado

Aceptado

## Fecha

2026-10-26

## Contexto

Los clientes web, y en el futuro una envoltura Capacitor, necesitan una API común. El encargo fija Node.js, TypeScript, Fastify, validación con Zod cuando corresponda y documentación OpenAPI. La fase 1 no debe construir los endpoints de reportes ni la autenticación.

## Decisión

`apps/api` es un proceso Fastify 5. El arranque, la configuración, los plugins transversales y las rutas quedan separados. Zod valida el entorno en el borde del proceso. Los errores HTTP usan la forma definida en `@field-service/contracts`.

Los recursos implementados son `GET /health`, `GET /health/ready` y `GET /api/v1`. Su contrato escrito está en `docs/architecture/openapi.yaml`. Ese documento se mantiene a mano. `@fastify/swagger` no se instala hasta que haya rutas de negocio que justifiquen servir la especificación desde el proceso.

Zod valida el entorno y los cuerpos compartidos en `@field-service/validation`. Las rutas de esta fase no reciben un cuerpo de entrada. Fastify seguirá usando JSON Schema en las rutas de negocio que sí lo reciban.

## Alternativas consideradas

### Express

- Ventajas: ecosistema amplio y ejemplos abundantes.
- Desventajas: el encargo pide Fastify, que ya incluye validación, serialización y un modelo de plugins.
- Rechazado.

### GraphQL o tRPC

- Ventajas: contratos tipados de extremo a extremo.
- Desventajas: el requisito académico pide una API REST y una auditoría más directa de los recursos HTTP.
- Rechazado.

## Consecuencias

- El frontend no importa código de `apps/api`.
- Una ruta nueva debe añadir su contrato, su prueba y su validación de entrada antes de considerarse lista.
- La autenticación, la autorización y los reportes quedan fuera de esta fase.
