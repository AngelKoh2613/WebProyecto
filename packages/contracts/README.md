# `@field-service/contracts`

Tipos y valores compartidos entre aplicaciones. El frontend no debe importar archivos de `apps/api`.

Exporta la respuesta de `GET /health`, la de `GET /health/ready`, el índice `GET /api/v1` y la forma de error HTTP. No exporta reportes de servicio: ese contrato todavía no está especificado.

Después de cambiar `src/`, ejecuta el build del paquete. La API y la web importan el JavaScript emitido en `dist/`.
