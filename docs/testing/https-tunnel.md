# Túnel HTTPS para pruebas locales

Fecha: 2026-10-26.

Estado: procedimiento escrito. El túnel no se inició. En este equipo no están `ngrok`, `cloudflared` ni `lt`. No se instaló ninguno y no se creó una cuenta. No hay capturas de un sitio público por HTTPS.

El entorno local comprobado sigue siendo HTTP:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3000`

## Qué herramienta usar

Ngrok, o un túnel equivalente, publica un puerto local mediante una URL HTTPS. La herramienta debe estar instalada y autenticada por la persona que ejecuta la prueba. El token de la cuenta se configura en el perfil local de esa herramienta. No se copia al repositorio, a `.env.example` ni al código.

PostgreSQL no se publica. El puerto 5432 permanece en la máquina. Tampoco se publica una consola de base de datos ni un panel de administración.

## Orden de arranque

Desde la raíz del repositorio, en terminales distintas:

```bash
pnpm --filter @field-service/api dev
pnpm --filter @field-service/web dev
```

La API queda en `127.0.0.1:3000`. Vite queda en `127.0.0.1:5173` y reenvía `/health`, `/health/ready` y `/api` a esa API. Con ese reenvío, el teléfono habla solo con el origen de Vite. La API y la base no necesitan una URL pública propia.

El túnel se abre únicamente hacia el puerto de Vite:

```bash
ngrok http 127.0.0.1:5173
```

Si se usa otra herramienta, el destino debe ser el mismo puerto y el mismo host local. La URL `https://` que muestre la herramienta es la URL de prueba. Cambia en cada sesión cuando el plan no reserva un dominio.

## CORS y variables

Con el proxy de Vite no hace falta `CORS_ORIGIN`: el navegador ve el mismo origen para la página y para `/health`. Hay que dejar `VITE_API_URL` vacío para que la web use rutas relativas. Si se define una URL absoluta de la API, el teléfono intentará llegar a esa URL y el proxy dejará de ser el camino.

Solo si se publica la API en un túnel distinto del frontend:

1. Anotar la URL HTTPS del túnel de la web.
2. Arrancar la API con `CORS_ORIGIN` igual a esa URL, sin barra final y sin `*`.
3. Construir o arrancar la web con `VITE_API_URL` igual a la URL HTTPS del túnel de la API.
4. Cerrar ambos túneles al terminar.

Ese segundo esquema abre la API directamente a internet. No se usa mientras el proxy de Vite baste.

## Comprobaciones

1. Abrir la URL HTTPS del túnel en el navegador de la computadora. La página debe identificar el sistema de reportes técnicos.
2. Desde esa misma página, el estado de la API debe salir de `GET /health` y `GET /health/ready`.
3. Pedir directamente `https://<url-del-tunel>/health`. La respuesta esperada, sin `DATABASE_URL`, es 200 y `{"status":"ok","service":"field-service-api"}`.
4. Pedir `https://<url-del-tunel>/health/ready`. Con la base de desarrollo configurada, la respuesta esperada es 200 y `database: up`. Sin `DATABASE_URL`, es 503 y `not_configured`.
5. Repetir la carga desde el teléfono, en la misma red o mediante la URL pública, y guardar una captura real.
6. Detener el túnel con la instrucción de la herramienta, normalmente `Ctrl+C` en su terminal, y después detener Vite y la API.

Estas comprobaciones no se ejecutaron el 2026-10-26 porque el túnel no existe en el equipo.

## Riesgos

- La URL pública permite a quien la conozca usar el proceso local mientras el túnel siga abierto.
- Un plan gratuito puede mostrar una página intermedia o cambiar la URL. Esa página no es la aplicación.
- El túnel no convierte el entorno en producción y no sustituye el TLS de Render.
- No se envían por ese camino secretos, `DATABASE_URL` ni copias de seguridad.
- Al cerrar la prueba hay que confirmar que el proceso del túnel terminó y que los puertos locales ya no se anuncian.

## Relación con Render

Render puede emitir el certificado del sitio público cuando exista un despliegue. Hasta entonces, un túnel es solo una prueba temporal. El despliegue no se ha realizado.
