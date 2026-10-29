# `@field-service/validation`

Esquemas Zod compartidos por la web y la API: salud, disponibilidad, índice y error HTTP. Depende de `@field-service/contracts` y emite `dist/`.

La validación de variables de entorno vive en `apps/api/src/config/env.ts` porque solo el servidor la usa. No se duplica aquí.

Los contratos definitivos de reportes y de sincronización offline todavía no pertenecen a este paquete.
