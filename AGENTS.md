# Field Service PWA

Monorepo de una PWA académica para reportes de servicio en campo. La plataforma, el shell instalable y la sincronización de reportes están implementados. La prueba en un teléfono y el HTTPS público siguen pendientes.

## Leer primero

- `docs/requirements/requirements.md`
- `docs/architecture/overview.md`
- `docs/development/phase-status.md`
- `docs/development/agent-workflow.md`
- `.cursor/rules/`

## Comandos

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

El estado verificado de esos comandos está en `docs/development/phase-status.md`.

## Límites

- Sin Docker, sin secretos y sin importar la API desde la web.
- No presentes como hecha una prueba de Android, iOS o HTTPS público si no está en `docs/testing/sprint-2-evidence.md`.
- Skills instaladas en `.agents/skills/`. No reinstalarlas si `skills-lock.json` ya las contiene.
