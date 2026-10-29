# Flujo de trabajo para agentes

Este proyecto se continúa con agentes de Cursor. El objetivo es que un agente nuevo pueda retomar una fase sin reconstruir las decisiones ni ampliar el alcance por su cuenta.

## Antes de editar

1. Leer las reglas de `.cursor/rules/` y `AGENTS.md`.
2. Revisar el inventario de `.agents/skills/` y `skills-lock.json`. No reinstalar las skills si ya están copiadas y son utilizables.
3. Leer la skill que corresponda a la tarea. Las instrucciones están en `.agents/skills/<nombre>/SKILL.md`. Las prioritarias para este repositorio son `using-agent-skills`, `context-engineering`, `spec-driven-development`, `planning-and-task-breakdown`, `documentation-and-adrs`, `api-and-interface-design`, `security-and-hardening`, `git-workflow-and-versioning` y `code-review-and-quality`.
4. Leer `docs/requirements/requirements.md`, el ADR afectado y `docs/development/phase-status.md`.
5. Inspeccionar los archivos que se van a modificar. No sobrescribir trabajo previo sin entenderlo.

## Durante el cambio

- Trabajar una tarea acotada del plan en `tasks/todo.md`.
- No modificar módulos ajenos al objetivo.
- Respetar los límites de `docs/architecture/overview.md`.
- No añadir Docker, secretos, microservicios ni proyectos nativos.
- No duplicar un tipo o un esquema si ya tiene un dueño.
- Si el código y un documento se contradicen, detenerse y registrar la contradicción. No elegir en silencio.
- Una dependencia nueva se justifica en el PR o en el estado de fase y se revisa su script de instalación antes de permitir `allowBuilds`.

## Verificación

- Ejecutar el typecheck, el lint y las pruebas del área modificada.
- Si cambia la interfaz, recorrer el flujo en el navegador. Una captura aislada no demuestra el comportamiento.
- No declarar una función terminada sin el comando y el resultado. "Debería funcionar" no es una verificación.
- Si un comando no puede ejecutarse, decir por qué.

## Después del cambio

- Actualizar el ADR o los requisitos cuando cambie una decisión.
- Dejar en `docs/development/phase-status.md` qué quedó hecho, qué se ejecutó y qué sigue pendiente.
- Informar dependencias añadidas, bloqueos y aprobaciones que faltan.
- No hacer commit ni push salvo que la persona que dirige el trabajo lo pida. El historial deseado, cuando se autorice, está en `docs/development/versioning.md`.

## Skills y reglas

Las reglas de Cursor son recordatorios cortos. No copian el texto completo de una skill. Si una regla y una skill discrepan, se consulta el encargo académico y los ADR; si el conflicto permanece, se pregunta.
