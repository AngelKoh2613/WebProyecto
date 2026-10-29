# Tareas de la fase 1

El encargo académico es la especificación de esta fase. Estas tareas son su desglose verificable.

## Tarea 1: Inventario del entorno y skills

**Descripción:** Comprobar el directorio, Git, Node, pnpm, PostgreSQL y las skills antes de crear la plataforma.

**Criterios de aceptación:**

- [x] El informe registra versiones y ausencias reales
- [x] Las skills de `addyosmani/agent-skills` quedan en `.agents/skills` si no estaban

**Verificación:**

- [x] Salida de `node -v`, `git --version` y `psql` o su ruta completa

**Dependencias:** Ninguna

**Archivos previstos:** `.agents/skills/**`, `skills-lock.json`

**Alcance estimado:** Medio

## Tarea 2: Workspaces y configuración

**Descripción:** Definir pnpm, Turbo, TypeScript, ESLint, Prettier, `.gitignore` y `.env.example`.

**Criterios de aceptación:**

- [x] Los workspaces incluyen las apps y los paquetes con manifiesto
- [x] No hay credenciales reales ni archivos Docker

**Verificación:**

- [x] `pnpm install` termina con código 0

**Dependencias:** Tarea 1

**Archivos previstos:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`

**Alcance estimado:** Medio

## Tarea 3: Contrato y API mínima

**Descripción:** Publicar el contrato de salud y una API que lo cumpla sin abrir PostgreSQL.

**Criterios de aceptación:**

- [x] `GET /health` responde el contrato
- [x] Una ruta desconocida usa el cuerpo de error compartido
- [x] El entorno inválido se rechaza

**Verificación:**

- [x] `pnpm --filter @field-service/api test`

**Dependencias:** Tarea 2

**Archivos previstos:** `packages/contracts/**`, `apps/api/**`

**Alcance estimado:** Medio

## Tarea 4: Web mínima

**Descripción:** Crear la aplicación Vite con la pantalla que declara el alcance pendiente.

**Criterios de aceptación:**

- [x] La pantalla muestra el nombre del producto y dice que el offline no está implementado
- [x] Tailwind participa en el build

**Verificación:**

- [x] `pnpm --filter @field-service/web test`
- [x] Abrir el servidor de desarrollo y comprobar el texto en el módulo servido. El navegador del IDE no respondió

**Dependencias:** Tarea 2

**Archivos previstos:** `apps/web/**`

**Alcance estimado:** Medio

## Tarea 5: Documentación, reglas y pendientes

**Descripción:** Dejar requisitos, arquitectura, ADR, flujo de agentes y reglas de Cursor.

**Criterios de aceptación:**

- [x] Cada ADR pedido existe con contexto, decisión, alternativas, consecuencias y estado
- [x] Los requisitos de la actividad están separados de las decisiones técnicas
- [x] La fase 2 queda enumerada y no empezada en el cierre de la fase 1

**Verificación:**

- [x] Los enlaces relativos del README apuntan a archivos existentes

**Dependencias:** Tareas 1-4

**Archivos previstos:** `docs/**`, `.cursor/rules/**`, `README.md`

**Alcance estimado:** Medio

## Comprobación: después de las tareas 1-5

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] Búsqueda sin resultados de `Dockerfile` y `docker-compose.yml`
- [x] Revisión de corrección, legibilidad, arquitectura, seguridad y rendimiento

## Tareas de la fase 2

## Tarea 6: Contratos y sondas

**Descripción:** Ampliar los contratos compartidos y cumplirlos en Fastify.

**Criterios de aceptación:**

- [x] `GET /health` no consulta la base
- [x] `GET /health/ready` distingue base sin configurar, caída y disponible
- [x] `GET /api/v1` identifica la versión inicial
- [x] Una ruta desconocida conserva el cuerpo de error

**Verificación:**

- [x] `pnpm --filter @field-service/api test`
- [x] Peticiones HTTP al proceso compilado, detenido después de la comprobación

**Dependencias:** Fase 1

**Archivos previstos:** `packages/contracts/**`, `packages/validation/**`, `apps/api/**`, `docs/architecture/openapi.yaml`

**Alcance estimado:** Medio

## Tarea 7: PostgreSQL y migración mínima

**Descripción:** Preparar Drizzle, una tabla técnica y una migración aditiva.

**Criterios de aceptación:**

- [x] La migración está versionada y solo crea `infrastructure_checks`
- [x] `db:migrate` rechaza un destino que no sea de desarrollo identificado
- [x] La migración se aplicó a `appweb_ykvs` el 2026-10-27
- [x] La prueba de integración real dejó de estar omitida y borró su propia fila

**Verificación:**

- [x] `pnpm --filter @field-service/api db:generate`
- [x] `psql -w` confirma que no hay credenciales; no se aplicó la migración

**Dependencias:** Tarea 6

**Archivos previstos:** `apps/api/src/db/**`, `database/migrations/**`

**Alcance estimado:** Medio

## Tarea 8: Pantalla y comprobación de la API

**Descripción:** Mostrar el sistema de reportes y el estado real de la API.

**Criterios de aceptación:**

- [x] La pantalla se renderiza sin PostgreSQL
- [x] El texto dice que el modo offline no está implementado
- [x] El estado de la API sale de las respuestas compartidas

**Verificación:**

- [x] `pnpm --filter @field-service/web test`
- [x] Vite sirvió el HTML en `http://127.0.0.1:5173/` y el proceso se detuvo

**Dependencias:** Tarea 6

**Archivos previstos:** `apps/web/**`

**Alcance estimado:** Medio
