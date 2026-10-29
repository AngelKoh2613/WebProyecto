# Checklist de instalación PWA

Fecha de la fase 1 del Sprint 2: 2026-10-27.

Las casillas de teléfono y de HTTPS público siguen vacías. No se abrió la aplicación en Android ni en iOS, y no hay una URL pública comprobada. Las casillas marcadas se apoyan en el manifiesto, los PNG y las pruebas del repositorio, no en un dispositivo.

| Criterio                                                                             | Estado    | Comprobación                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ] El sitio se sirve mediante HTTPS en el entorno de prueba.                        | Pendiente | No hay túnel ni despliegue. El procedimiento está en `https-tunnel.md`.                                                                                                                                                     |
| [x] `manifest.webmanifest` existe y puede cargarse.                                  | Hecho     | `apps/web/public/manifest.webmanifest`. Vite lo sirve en desarrollo y Fastify lo sirve desde el build.                                                                                                                      |
| [x] El manifiesto contiene un nombre y un nombre corto apropiados.                   | Hecho     | `name` y `short_name` son `Field Service`.                                                                                                                                                                                  |
| [x] Se definen los iconos necesarios de 192 × 192 y 512 × 512.                       | Hecho     | PNG `any` y `maskable` en `apps/web/public/icons/`. La prueba lee el IHDR.                                                                                                                                                  |
| [x] Los recursos referenciados por el manifiesto existen.                            | Hecho     | Las cuatro rutas de `icons` apuntan a archivos PNG con esas dimensiones.                                                                                                                                                    |
| [x] Se define el modo de visualización `standalone`.                                 | Hecho     | `display` es `standalone`.                                                                                                                                                                                                  |
| [x] El manifiesto se encuentra vinculado correctamente desde el HTML.                | Hecho     | `apps/web/index.html` tiene `rel="manifest"` y `theme-color`.                                                                                                                                                               |
| [x] El Service Worker se registra en el build de producción.                         | Hecho     | Un solo registro, desde `registerProductionServiceWorker`, y solo si el build es de producción.                                                                                                                             |
| [x] El Service Worker incorpora interceptación `fetch` para el shell.                | Hecho     | Workbox precachea la interfaz y usa `index.html` como fallback de navegación. `/api` y `/health` quedan fuera.                                                                                                              |
| [ ] Se comprueba la instalación en Chrome para Android.                              | Pendiente | No hay dispositivo ni sitio HTTPS público. El procedimiento está en `docs/testing/sprint-2-evidence.md`.                                                                                                                    |
| [ ] Se comprueba la instalación en Safari para iOS.                                  | Pendiente | No hay dispositivo ni sitio HTTPS público.                                                                                                                                                                                  |
| [x] Se documentan las diferencias de instalación entre plataformas.                  | Hecho     | `docs/architecture/browser-compatibility.md`. No las verifica en teléfonos.                                                                                                                                                 |
| [x] Se verifica la carga de los recursos esenciales en el build.                     | Hecho     | `assert-pwa-build.mjs` comprueba `sw.js`, el manifiesto y los iconos de 192 y 512.                                                                                                                                          |
| [x] Se comprueba en un navegador que la interfaz abre sin red tras la primera carga. | Hecho     | Edge sin interfaz, el 2026-10-27, contra `http://127.0.0.1:3011`. El documento nuevo mostró la interfaz, «Sin conexión» y «El servidor no responde». `GET /health` y `POST /api/v1` fallaron. No es una prueba de teléfono. |
| [x] Se documentan los resultados y los problemas encontrados.                        | Hecho     | Esta lista y `docs/development/phase-status.md`. No hay captura de instalación.                                                                                                                                             |

## Qué no hacía la fase 1

El shell no guardaba reportes. La fase 2 del Sprint 2 añadió IndexedDB, el formulario, la cola y los reintentos, descritos en ADR-006. Un POST, PUT, PATCH o DELETE sigue sin considerarse hecho solo porque el Service Worker lo haya visto.

«En línea» y «Sin conexión» describen `navigator.onLine`. «Base de datos disponible» describe PostgreSQL. «La interfaz puede abrirse sin conexión» solo aparece cuando Workbox confirma el precaché.

## Comandos

Desde la raíz del repositorio:

```bash
pnpm --filter @field-service/web dev
pnpm --filter @field-service/web test
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

El desarrollo usa Vite en `http://127.0.0.1:5173` y no registra el Service Worker. El manifiesto y los iconos sí se pueden abrir ahí. La API de desarrollo sigue en `http://127.0.0.1:3000`, reenviada por el proxy de Vite.

Para ver el Service Worker, el build tiene que servirlo Fastify:

```bash
pnpm build
$env:NODE_ENV="production"
$env:HOST="127.0.0.1"
$env:PORT="3011"
node apps/api/dist/server.js
```

## Comprobación manual del shell sin conexión

1. Abrir `http://127.0.0.1:3011/` en Chrome o Edge y recargar una vez con red.
2. En las herramientas de desarrollo, confirmar que hay un solo Service Worker en la raíz.
3. Marcar la red como offline y recargar `/`. Debe verse la interfaz ya visitada.
4. Con la red cortada, `GET /health` y `POST /api/v1` no deben responder con la página HTML ni con un éxito inventado.
5. Volver a conectar. Si hay un build nuevo, la interfaz muestra «Actualización disponible» y el botón Actualizar.

En iOS, el aviso `beforeinstallprompt` no existe. La instalación es «Añadir a pantalla de inicio» y no se ha probado. El botón Instalar del código solo aparece cuando el navegador emite ese evento.

## Diferencias que siguen vigentes

Chrome para Android y Safari para iOS no comparten el mismo gesto de instalación. En iOS, WebKit distingue `standalone` o `fullscreen` para el almacenamiento de una aplicación de pantalla de inicio. El detalle está en la tabla de compatibilidad.

El controlador `fetch` sigue siendo un requisito del encargo académico aunque Chrome, desde la versión 108 en móvil, ya no lo exija para instalar desde el menú.
