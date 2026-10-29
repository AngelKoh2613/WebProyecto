# Requisitos y especificación de la fase 1

## Objetivo

Técnicos de campo necesitan registrar y consultar reportes de servicio en zonas rurales donde la conexión falla. La solución académica es una PWA utilizable en Android e iOS, con API REST, PostgreSQL y despliegue público.

La fase 1 preparó el repositorio, los límites entre módulos y la documentación. La fase 2 del proyecto dejó ejecutables la web, la API y PostgreSQL. La fase 3 documentó la arquitectura. En el Sprint 2, la interfaz puede instalarse como shell y los reportes se guardan y sincronizan. Siguen pendientes el teléfono, Lighthouse y el HTTPS público.

El encargo escrito por el equipo académico se trata como especificación aprobada de esta fase. Las decisiones que aún requieren confirmación están en [Preguntas abiertas](#preguntas-abiertas).

## Requisitos de la actividad

Estos puntos los exige la actividad. No están implementados salvo que la columna de estado diga lo contrario.

| ID     | Requisito                                           | Estado                                                                            |
| ------ | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| REQ-01 | Técnicos de campo operan con conectividad limitada  | Registrado. Sin flujo de campo                                                    |
| REQ-02 | Registro y consulta de reportes de servicio         | Alta local y remota por `clientId`. Sin listado general                           |
| REQ-03 | Interfaz responsiva                                 | Inicio, formulario y lista de reportes con Tailwind                               |
| REQ-04 | Uso desde Android e iOS mediante el navegador       | Pendiente de prueba en dispositivos                                               |
| REQ-05 | Instalación como PWA                                | Manifiesto y Service Worker listos. Sin prueba en un teléfono ni en HTTPS público |
| REQ-06 | HTTPS en el despliegue público                      | Previsto en Render. No desplegado                                                 |
| REQ-07 | Web App Manifest                                    | `apps/web/public/manifest.webmanifest`, enlazado en el HTML                       |
| REQ-08 | Service Worker que intercepte `fetch`               | Workbox en el build. Precaché y fallback de navegación. La API no se cachea       |
| REQ-09 | Caché de recursos esenciales                        | Precaché del shell. Sin caché de respuestas de la API                             |
| REQ-10 | Persistencia local de reportes                      | IndexedDB con Dexie. Probado con `fake-indexeddb`                                 |
| REQ-11 | Recuperación y sincronización al volver la conexión | Cola local. Sin Background Sync y sin prueba en iOS                               |
| REQ-12 | API REST                                            | Salud, índice y `POST`/`GET` de un reporte                                        |
| REQ-13 | Auditoría Lighthouse de la PWA                      | Pendiente                                                                         |
| REQ-14 | Prueba en Chrome para Android y Safari para iOS     | Pendiente                                                                         |
| REQ-15 | Repositorio GitHub y despliegue público             | Git local preparado. Sin remoto ni despliegue                                     |

## Decisiones técnicas propuestas

No son requisitos de la actividad. Traducen esos requisitos a una implementación y pueden cambiar mediante un ADR.

| Propuesta                        | Sirve a                                 | ADR                                       |
| -------------------------------- | --------------------------------------- | ----------------------------------------- |
| React, TypeScript y Vite         | REQ-03, REQ-04, REQ-05                  | ADR-001                                   |
| Monorepo pnpm y Turborepo        | Mantenimiento del conjunto              | ADR-002                                   |
| Fastify y REST                   | REQ-12                                  | ADR-003                                   |
| PostgreSQL sin Docker            | Persistencia del servidor               | ADR-004, ADR-008                          |
| Drizzle ORM                      | Migraciones tipadas                     | ADR-004, migración aplicada en desarrollo |
| `vite-plugin-pwa` y Workbox      | REQ-05, REQ-07, REQ-08, REQ-09          | ADR-005, aceptado para la interfaz        |
| Dexie.js e IndexedDB             | REQ-10, REQ-11                          | ADR-006, aceptado                         |
| Render y PostgreSQL administrado | REQ-06, REQ-15                          | ADR-007, propuesto                        |
| Capacitor opcional               | Extensión nativa, sin reemplazar la PWA | ADR-009                                   |

## Mapa de capacidades

La actividad agrupa varias capacidades que se pueden verificar por separado. Este mapa fija el orden; no autoriza implementarlas en la fase 1.

| Módulo            | Responsabilidad                                       | Depende de        |
| ----------------- | ----------------------------------------------------- | ----------------- |
| `platform`        | Repositorio, límites, calidad y documentación         | —                 |
| `service-reports` | Registro y consulta de reportes en la API y en la web | `platform`        |
| `offline-sync`    | Copia local, cola y sincronización                    | `service-reports` |
| `pwa-shell`       | Manifiesto, Service Worker, caché e instalación       | `platform`        |
| `deployment`      | GitHub, Render, HTTPS y PostgreSQL administrado       | `platform`        |

Orden de construcción: `platform` → `service-reports` y `pwa-shell` → `offline-sync` → `deployment` puede prepararse en paralelo cuando los builds ya existan. La plataforma, el shell, el alta de reportes y la cola local están construidos. El despliegue público sigue pendiente.

## Comandos

Desde la raíz, con pnpm 12.15.0 en el `PATH`:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm --filter @field-service/web dev
pnpm --filter @field-service/api dev
```

Qué comandos ya se ejecutaron y con qué resultado está en `docs/development/phase-status.md`. Un comando listado aquí no está verificado solo por aparecer en este documento. Node.js 22.14.0 trae Corepack 0.31.0, que no arranca pnpm 12; el arreglo aplicado fue instalar pnpm en el prefijo de usuario, no actualizar Node.

## Estructura del proyecto

```text
apps/web        Interfaz React
apps/api        API Fastify
apps/mobile     Reserva Capacitor, sin proyecto nativo
packages/*      Contratos, validación, dominio y config
database/       PostgreSQL: migración técnica pendiente de aplicarse
docs/           Requisitos, arquitectura, desarrollo y despliegue
.cursor/rules   Reglas persistentes para agentes
.agents/skills  Skills de trabajo instaladas
```

## Estilo de código

TypeScript estricto, módulos ES, exportaciones con nombre y validación en los bordes. Un ejemplo real del borde de configuración:

```typescript
const parsed = envSchema.safeParse(defined);
if (!parsed.success) {
  throw new Error(`Invalid environment: ${names.join(", ")}`);
}
```

El mensaje nombra la variable rechazada y omite su valor. Una cadena vacía no pisa el valor por defecto.

Prettier fija el formato. No se reformatean las skills de `.agents/`.

## Estrategia de pruebas

- Vitest en la API, contra la aplicación en memoria. La integración real se ejecuta cuando `.env` apunta a un destino de desarrollo identificado.
- Vitest, Testing Library y jsdom en la web, sobre la pantalla inicial y el cliente de estado.
- No hay cobertura mínima numérica: no se ha acordado un umbral y un número inventado no mejora la prueba.
- Una función de producto no se da por terminada con una prueba de humo de `/health`.

## Límites

- Siempre: leer los requisitos y los ADR antes de cambiar de arquitectura; validar el entorno y las entradas externas; mantener TypeScript estricto; ejecutar las pruebas del área tocada; actualizar la documentación cuando cambie una decisión.
- Preguntar antes: esquema de base de datos, autenticación, CORS, dependencias nuevas, despliegue, creación de roles o bases PostgreSQL, commit o push.
- Nunca: Docker; secretos en el repositorio; Service Worker o sincronización presentados como listos sin una ejecución; importar `apps/api` desde la web; microservicios, Kubernetes o Flutter en este alcance.

## Criterios de éxito

La fase 1 queda hecha cuando se cumplen los diez criterios del encargo: estructura con responsabilidades, ADR, requisitos trazables, reglas de Cursor, skills usadas, PostgreSQL sin Docker, bases mínimas de web y API si el entorno lo permite, instrucciones contrastadas con los archivos, pendientes explícitos y ninguna función excluida implementada de forma prematura.

## Preguntas abiertas

1. ¿Se crea el commit inicial y el remoto de GitHub en esta fase? El encargo no lo pide de forma explícita y la regla del repositorio exige una solicitud de commit.
2. `render.yaml` usa el plan `free` y no elige región. ¿Se confirma ese plan antes de aplicar el blueprint?
3. La base de desarrollo `appweb_ykvs` ya existe y la migración técnica se aplicó el 2026-10-27. ¿Se autoriza el commit inicial y el remoto de GitHub?
4. ¿La interfaz de producto será en español? La pantalla inicial lo está porque el encargo y los usuarios descritos están en español.
