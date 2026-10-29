# Recursos estáticos

Vite copia este directorio a la raíz de `apps/web/dist` sin procesarlo como módulo. El sitio previsto en Render se publica en el origen, así que las rutas de estos archivos empiezan por `/`.

## Archivos

- `favicon.svg` es el icono de la pestaña.
- `manifest.webmanifest` es el manifiesto de instalación. `index.html` lo enlaza con `rel="manifest"`.
- `icons/icon-192.png` y `icons/icon-512.png` son los iconos `purpose: any`.
- `icons/icon-maskable-192.png` y `icons/icon-maskable-512.png` llenan el lienzo y dejan el símbolo dentro de la zona segura.

El Service Worker no vive aquí. `vite-plugin-pwa` lo genera como `sw.js` en el build de producción. En `pnpm dev` no se registra.

`VITE_API_URL` vacío mantiene las llamadas en el mismo origen. En desarrollo, Vite reenvía `/health` y `/api` a `http://127.0.0.1:3000`. En producción, Fastify sirve el build y esas rutas siguen en el mismo origen. El Service Worker no las precachea ni las usa como fallback de navegación.
