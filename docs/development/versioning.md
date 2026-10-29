# Versión y commits

El repositorio usa versionado semántico. La base de la fase 1 es `0.1.0`: hay aplicaciones que arrancan, pero no hay un producto desplegable. La versión `1.0.0` queda reservada para la entrega que cumpla los requisitos de la actividad, no para esta fase.

## Ramas

El tronco es `main` y debe poder construir. El trabajo nuevo entra por ramas cortas:

- `feature/<descripcion>`
- `fix/<descripcion>`
- `chore/<descripcion>`
- `docs/<descripcion>`

No hay rama de desarrollo permanente. No se usa GitFlow.

## Commits

Formato Conventional Commits:

```text
<tipo>: <resumen en imperativo>

<cuerpo opcional con el motivo>
```

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

Cada commit cubre un cambio coherente. No se mezcla un formato masivo con una función. No se usa `--no-verify` ni se reescribe historia ya publicada salvo una petición explícita.

## Etiquetas

No hay etiquetas en la fase 1. La primera etiqueta se creará cuando exista un despliegue que se quiera identificar.
