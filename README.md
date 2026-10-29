# Servicios técnicos de campo

PWA académica para que un técnico de campo registre y consulte reportes de servicio en zonas con poca o ninguna conexión, desde Android e iOS.

## Objetivo

El problema es la pérdida de conectividad durante el trabajo en campo: un reporte que solo existe en un formulario en línea no se puede guardar ni revisar cuando la red desaparece. La aplicación prevista combina una interfaz instalable, una copia local y una API que confirma los reportes en PostgreSQL cuando la conexión vuelve.

Esta versión guarda el reporte en el dispositivo, lo sincroniza con PostgreSQL cuando la API responde y puede servirse como un solo proceso: Fastify entrega la API y el build de React. Hay manifiesto y Service Worker. El sitio público es `https://webproyecto.onrender.com`. No hay prueba en un teléfono.

## Funciones previstas

- Registro y consulta de reportes de servicio.
- Interfaz usable en pantallas de teléfono.
- Instalación como PWA, con manifiesto y Service Worker.
- Persistencia local y sincronización al recuperar la red.
- API REST y PostgreSQL.
- Despliegue público en Render, con el código en GitHub.

El registro local, la cola y el alta idempotente están implementados. La instalación en Android e iOS no se ha comprobado. El despliegue HTTPS respondió el 2026-10-29. En desarrollo, Vite y Fastify arrancan por separado. En producción, un solo proceso Node sirve la interfaz y la API en el mismo origen.

## Tecnologías

| Pieza             | Elección                              | Estado                                                  |
| ----------------- | ------------------------------------- | ------------------------------------------------------- |
| Interfaz          | React, TypeScript, Vite, Tailwind CSS | Inicio, formulario y lista de reportes                  |
| API               | Node.js, TypeScript, Fastify, Zod     | Salud, índice y alta idempotente de un reporte          |
| Contratos         | `@field-service/contracts`            | Salud, errores y el cuerpo del reporte                  |
| Validación        | `@field-service/validation`           | Esquemas Zod de esas respuestas                         |
| Datos de servidor | PostgreSQL                            | Base de desarrollo conectada; el secreto no está en Git |
| ORM               | Drizzle                               | Migraciones aditivas aplicadas en esa base              |
| Offline           | IndexedDB y Dexie.js                  | Cola local implementada                                 |
| PWA               | `vite-plugin-pwa` y Workbox           | Shell precacheado. Sin prueba en un teléfono            |
| Monorepo          | pnpm y Turborepo                      | Configurado                                             |
| Despliegue        | Render, un servicio web               | `render.yaml` preparado; no aplicado                    |
| Móvil nativo      | Capacitor                             | Reserva en `apps/mobile`, sin proyectos                 |

Las decisiones y sus alternativas están en [`docs/architecture/decisions`](docs/architecture/decisions/README.md).

## Requisitos previos

- Node.js 22.14 o superior. En el entorno de preparación: Node.js 22.14.0 y npm 10.9.2.
- Git. En el entorno de preparación: 2.47.1.
- pnpm 12.15.0. El Corepack 0.31.0 incluido en Node.js 22.14.0 no puede arrancarlo: busca `bin/pnpm.cjs` y pnpm 12 publica `bin/pnpm.mjs`. Corepack 0.36.0 exige Node.js `^22.22.2`, así que no se actualizó Node. En este equipo pnpm quedó instalado en el prefijo de usuario con `npm install -g pnpm@12.15.0`.
- PostgreSQL nativo para las fases con persistencia. En este equipo está PostgreSQL 18.2, servicio `postgresql-x64-18` en ejecución, cliente en `C:\Program Files\PostgreSQL\18\bin\psql.exe` y fuera del `PATH`. No hace falta para arrancar la fase 1.
- Docker no se usa, aunque esté instalado.

## Estructura

```text
apps/web                 Interfaz React
apps/api                 API Fastify
apps/mobile              Reserva Capacitor
packages/contracts       Tipos compartidos
packages/validation      Esquemas Zod de las respuestas iniciales
packages/domain          Reglas de negocio, todavía vacías
packages/config          Dueño previsto de la configuración compartida
database                 Migración técnica de PostgreSQL aplicada en desarrollo
docs                     Requisitos, arquitectura, desarrollo y despliegue
.cursor/rules            Reglas para agentes
.agents/skills           Skills de ingeniería
```

El detalle de responsabilidades está en [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Comandos

Con pnpm 12.15.0 en el `PATH`:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm e2e
pnpm build
pnpm start
pnpm --filter @field-service/web dev
pnpm --filter @field-service/api dev
pnpm --filter @field-service/api db:generate
pnpm --filter @field-service/api db:migrate
```

`db:migrate` solo se ejecuta contra un destino de desarrollo identificado: `field_service_dev` en local, o `appweb_ykvs` en su host de Render comprobado. No forma parte del arranque.

En desarrollo, la API escucha en `http://127.0.0.1:3000` y Vite en `http://127.0.0.1:5173`. Vite reenvía `/health` y `/api`.

`pnpm build` compila los paquetes, la web y la API. `pnpm start` ejecuta `node apps/api/dist/server.js`. Para servir también la interfaz hace falta `NODE_ENV=production`. El detalle, incluido el arranque local de producción, está en [docs/deployment/render.md](docs/deployment/render.md). Node no carga `.env` solo.

Los comandos que ya se ejecutaron, y su resultado, están en [`docs/development/phase-status.md`](docs/development/phase-status.md). Si un comando de esta lista no aparece allí con un resultado, todavía no consta como verificado.

## Documentación

- [Requisitos](docs/requirements/requirements.md)
- [Arquitectura](docs/architecture/overview.md)
- [Contrato HTTP de la fase 2](docs/architecture/openapi.yaml)
- [Matriz de decisión](docs/architecture/decision-matrix.md)
- [Compatibilidad por sistema](docs/architecture/browser-compatibility.md)
- [Checklist de instalación PWA](docs/testing/pwa-installation-checklist.md)
- [Túnel HTTPS](docs/testing/https-tunnel.md)
- [Evidencias del Sprint 1](docs/testing/sprint-1-evidence.md)
- [Evidencias del Sprint 2](docs/testing/sprint-2-evidence.md)
- [Decisiones](docs/architecture/decisions/README.md)
- [Flujo de agentes](docs/development/agent-workflow.md)
- [Versiones y commits](docs/development/versioning.md)
- [Estado de la fase](docs/development/phase-status.md)
- [Pruebas](docs/testing/strategy.md)
- [Despliegue](docs/deployment/render.md)
- [PostgreSQL](database/README.md)
- [Instrucciones para agentes](AGENTS.md)

## Variables de entorno

Copia [`.env.example`](.env.example) a `.env` solo cuando necesites sustituir los valores locales. El ejemplo no contiene una credencial utilizable. `.env` está ignorado por Git.
