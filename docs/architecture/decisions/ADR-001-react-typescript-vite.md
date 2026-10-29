# ADR-001: React, TypeScript y Vite

## Estado

Aceptado

## Fecha

2026-10-26

## Contexto

La interfaz debe funcionar en navegadores de Android e iOS, ser instalable como PWA y poder reutilizarse más adelante dentro de Capacitor. El encargo fija React, TypeScript y Vite. La fase 1 solo necesita una aplicación que arranque, no las pantallas de reportes.

## Decisión

`apps/web` usa React 19, TypeScript en modo estricto y Vite 8. Tailwind CSS 4 entra mediante `@tailwindcss/vite` porque su configuración se limita al plugin y a una hoja de estilos.

shadcn/ui no se instala en esta fase. Sus componentes se copian al proyecto cuando exista una pantalla que los use. Instalar ahora el conjunto de primitivas añadiría dependencias sin una interfaz que las ejerza.

Vitest y Testing Library cubren la prueba de humo de la pantalla inicial.

## Alternativas consideradas

### Next.js

- Ventajas: enrutado y renderizado de servidor integrados.
- Desventajas: no lo pide el encargo y complica el objetivo de una PWA estática desplegable en Render.
- Rechazado: Vite mantiene el cliente como aplicación separada de la API.

### CSS sin Tailwind

- Ventajas: ninguna dependencia de estilos.
- Desventajas: el encargo pide preparar Tailwind si la configuración sigue siendo pequeña.
- Rechazado: el plugin oficial de Vite es suficiente para dejar la base lista.

## Consecuencias

- La interfaz y la API se construyen y despliegan por separado.
- El Service Worker no forma parte de esta decisión. Está en ADR-005.
- TypeScript 7.0.2 es el release actual, pero `typescript-eslint` 8.72.1 solo acepta `typescript` `<6.1.0`. El catálogo fija TypeScript 6.0.3 para que el lint tenga un peer válido. Se revisará cuando el parser declare soporte para TypeScript 7.
- jsdom 30 exige, por medio de `w3c-xmlserializer` 6, Node.js `^22.22.2`. Este entorno tiene Node.js 22.14.0, así que la web usa jsdom 26.1.0, cuyo motor declarado es `>=18`.
- Las versiones concretas quedan fijadas por `pnpm-lock.yaml`.
