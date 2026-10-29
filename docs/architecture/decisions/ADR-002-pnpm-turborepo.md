# ADR-002: Monorepo con pnpm y Turborepo

## Estado

Aceptado

## Fecha

2026-10-26

## Contexto

El frontend, la API y los contratos compartidos deben evolucionar juntos sin convertirse en un solo paquete ni en varios repositorios. El encargo pide pnpm workspaces y Turborepo. pnpm no estaba en el `PATH`. El Corepack 0.31.0 de Node.js 22.14.0 descarga pnpm 12.15.0, pero intenta ejecutar `bin/pnpm.cjs`, un archivo que esa versión ya no publica.

## Decisión

Un solo repositorio, `field-service-pwa`, con workspaces en `apps/*` y `packages/*`. Turborepo ordena `build`, `typecheck`, `test` y `dev` solo donde cada paquete define ese script. El lint y Prettier se ejecutan una vez desde la raíz porque su configuración es única.

`packageManager` fija pnpm 12.15.0. En este entorno se instaló con `npm install -g pnpm@12.15.0` en el prefijo de usuario `C:\Users\unixc\AppData\Roaming\npm`, porque actualizar a Corepack 0.36.0 exigía Node.js `^22.22.2` y no se cambió el runtime. Los scripts de instalación de dependencias quedan bloqueados salvo los paquetes enumerados en `allowBuilds`, con `strictDepBuilds` activado. El único script permitido tras la instalación es el de `esbuild`, que descarga su binario de plataforma.

## Alternativas consideradas

### npm workspaces

- Ventajas: ya estaba disponible como `npm` 10.9.2.
- Desventajas: el encargo pide pnpm y su aislamiento de dependencias encaja con el control de scripts de instalación.
- Rechazado: pnpm sigue siendo el gestor. La instalación global fue el arreglo del Corepack incluido, no un cambio de herramienta.

### Repositorios separados

- Ventajas: permisos y despliegues independientes.
- Desventajas: los contratos se duplicarían o exigirían publicación de paquetes para un equipo académico.
- Rechazado: el volumen del sistema no justifica esa fricción.

## Consecuencias

- `apps/mobile` no es un workspace: no tiene `package.json`.
- Un paquete solo entra en una tarea de Turbo si declara el script correspondiente.
- La aceptación depende de que `pnpm install`, el typecheck, el lint, las pruebas y el build terminen con éxito. El resultado queda en `docs/development/phase-status.md`. Si esa verificación falla, este ADR vuelve a propuesto hasta corregirlo.
