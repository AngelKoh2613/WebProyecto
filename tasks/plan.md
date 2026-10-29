# Plan de implementación: fases 1 y 2

## Resumen

Preparar un monorepo pnpm y Turborepo con una web Vite y una API Fastify que arranquen, más la documentación que permite continuar sin rehacer la estructura. El producto de reportes, la PWA y la sincronización quedan fuera.

## Decisiones de arquitectura

- Los ADR 001 a 009 registran el stack, la exclusión de Docker y lo que sigue propuesto.
- Drizzle está instalado. La migración técnica se aplicó a la base de desarrollo identificada.
- Render, el Service Worker e IndexedDB no se integran hasta poder verificarlos.
- El contrato ejecutable de la fase 2 es la pantalla inicial, `GET /health`, `GET /health/ready` y `GET /api/v1`.

## Lista de tareas

### Fase 1: Plataforma

Las tareas detalladas y su verificación están en `tasks/todo.md`.

### Comprobación: Plataforma

- [x] `pnpm install` termina y escribe `pnpm-lock.yaml`
- [x] `typecheck`, `lint`, `test` y `build` terminan con código 0
- [x] Vite sirve la pantalla en `http://127.0.0.1:5173/` y la API responde en `/health`. El navegador del IDE no estaba disponible
- [x] No hay archivos Docker ni secretos

### Fase 2: Base ejecutable

- [x] La web compila, muestra el sistema de reportes y consulta el estado de la API
- [x] `GET /health`, `GET /health/ready` y `GET /api/v1` responden con el contrato compartido
- [x] La migración aditiva de `infrastructure_checks` está versionada
- [x] La migración se aplicó el 2026-10-27 a la base de desarrollo identificada `appweb_ykvs`
- [x] El informe distingue las pruebas ejecutadas de la integración omitida

### Fase 3: Cierre documental del Sprint 1

- [x] La matriz de decisión y la compatibilidad están escritas con fuentes y fecha
- [x] El checklist de instalación deja en pendiente el manifiesto, el Service Worker y los dispositivos
- [x] El procedimiento HTTPS está escrito y el túnel no se ejecutó
- [x] `GET /health` se volvió a consultar en `127.0.0.1:3000`
- [ ] La instalación PWA y el modo offline quedan para el Sprint 2

### Sprint 2: PWA funcional

No está empezado. Incluye el manifiesto, los iconos, el Service Worker con `fetch`, la caché, IndexedDB y la prueba en dispositivos.

## Riesgos y mitigaciones

| Riesgo                                       | Impacto | Mitigación                                                                                     |
| -------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| TypeScript 7 o Vite 8 rompen ESLint o Vitest | Alto    | Verificar en esta fase y fijar el lockfile; bajar de versión solo si la herramienta falla      |
| Un script de dependencia queda bloqueado     | Medio   | Revisar el script y permitir solo ese paquete en `allowBuilds`                                 |
| PostgreSQL no está en el `PATH`              | Bajo    | Documentar la ruta del cliente; no crear bases ni usar Docker                                  |
| No hay contraseña para la instancia local    | Alto    | Dejar la migración generada y la prueba de integración omitida hasta autorizar la base         |
| `render.yaml` crea un servicio al aplicarse  | Medio   | Plan `free`, sin base de datos y con despliegue automático apagado. No aplicarlo sin revisarlo |

## Preguntas abiertas

Las cuatro preguntas de `docs/requirements/requirements.md` siguen abiertas. No bloquean la plataforma porque el encargo ya fijó el alcance de la fase 1.
