# ADR-005: Estrategia PWA y Service Worker

## Estado

Aceptado para la interfaz. La persistencia de reportes sigue en ADR-006.

## Fecha

2026-10-26. Aplicado el 2026-10-27 en la fase 1 del Sprint 2.

## Contexto

La actividad exige una PWA convencional: manifiesto, Service Worker con interceptación `fetch`, HTTPS, caché de recursos esenciales e instalación desde el navegador. También exige funcionar en Android e iOS. El Sprint 1 dejó esas piezas sin implementar.

Esta fase solo prepara la instalación y la apertura de la interfaz después de una primera carga. No guarda reportes en el dispositivo ni los sincroniza.

## Decisión

La PWA vive en `apps/web` con `vite-plugin-pwa` 1.3.0 y Workbox 7.4.1. El plugin declara compatibilidad de peer con Vite 8, que es la versión instalada. Hay un solo Service Worker, generado en el build (`generateSW`), no escrito a mano y no registrado dos veces.

El manifiesto está en `apps/web/public/manifest.webmanifest`. El plugin no genera otro. `index.html` lo enlaza y declara `theme-color`. Los iconos PNG de 192 y 512, con variantes maskable, están en `apps/web/public/icons/`.

Workbox precachea el shell: HTML, JS, CSS y los archivos públicos listados en `precachedPublicAssets`. `navigateFallback` responde con `/index.html` solo a navegaciones que no sean `/api` ni `/health`. `runtimeCaching` queda vacío: las peticiones de la API, incluidas POST, PUT, PATCH y DELETE, no se convierten en éxito por haberlas interceptado. `cleanupOutdatedCaches` borra cachés antiguas de Workbox de esta aplicación. `registerType` es `prompt`: la interfaz avisa cuando hay una versión nueva y el usuario confirma la actualización. `onRegisterError` marca el fallo y no presenta la interfaz como lista sin conexión.

`registerProductionServiceWorker` solo corre cuando `import.meta.env.PROD` es verdadero. En `pnpm dev` el Service Worker no se registra. En producción, Fastify sirve `sw.js`, el manifiesto y los iconos desde `apps/web/dist` porque son archivos reales. Las rutas sin extensión siguen entregando `index.html`. `/api` y `/health` siguen siendo JSON.

La pantalla distingue la red del navegador de la respuesta de PostgreSQL. «La interfaz puede abrirse sin conexión» solo aparece después de que Workbox confirme el precaché. El botón Instalar solo aparece si el navegador emite `beforeinstallprompt`.

## Alternativas consideradas

### Service Worker escrito a mano

- Ventajas: control explícito del evento `fetch`.
- Desventajas: habría que mantener el precaché del build, la limpieza de cachés y el aviso de actualización.
- Rechazado en esta fase: Workbox, a través del plugin compatible con Vite 8, cubre ese precaché y deja un solo `sw.js`.

### Registrar el Service Worker también en el servidor de desarrollo

- Rechazado: Vite ya sirve el manifiesto y los iconos desde `public/`. Un segundo registro en desarrollo complicaría la recarga y no es el artefacto que Fastify publica.

## Consecuencias

- Este Service Worker no guarda reportes. La copia local y la cola están en ADR-006.
- La instalación en Chrome para Android y Safari para iOS no se ha ejecutado. El sitio público HTTPS tampoco.
- Una petición de escritura no se da por hecha porque el Service Worker la haya visto. El reintento lo hace la cola de ADR-006.
- El precaché permite abrir la interfaz ya visitada sin red. Crear un reporte sin red usa IndexedDB, no la caché del shell.
