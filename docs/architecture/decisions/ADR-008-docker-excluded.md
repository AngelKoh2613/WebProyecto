# ADR-008: Docker excluido del proyecto

## Estado

Aceptado

## Fecha

2026-10-26

## Contexto

El encargo prohíbe Docker y Docker Compose para el desarrollo y para resolver la ausencia de PostgreSQL. Docker está instalado en el equipo, versión 29.3.0, y no se utiliza.

## Decisión

El repositorio no incluye `Dockerfile`, `docker-compose.yml`, manifiestos de Kubernetes ni scripts que invoquen Docker. PostgreSQL se usa desde la instalación nativa o desde el servicio administrado de Render.

Si una herramienta falta, se documenta. No se sustituye por un contenedor.

## Alternativas consideradas

### Postgres en contenedor

- Ventajas: misma versión para todo el equipo sin instalar el motor.
- Desventajas: contradice la restricción obligatoria del encargo.
- Rechazado.

## Consecuencias

- La documentación de desarrollo no puede exigir Docker para instalar, probar o arrancar.
- Una revisión debe rechazar cualquier archivo o dependencia cuyo uso ordinario requiera Docker.
- Kubernetes y los microservicios quedan fuera del alcance por la misma razón de simplicidad.
