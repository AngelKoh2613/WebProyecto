# ADR-007: Render como plataforma de despliegue

## Estado

Sustituido en la forma de publicar la web y la API por ADR-010. Render sigue siendo la plataforma prevista y el despliegue no se ha ejecutado.

## Fecha

2026-10-26

## Contexto

El resultado académico debe quedar en un repositorio GitHub y en un despliegue público con HTTPS. El encargo elige Render y PostgreSQL administrado. El servicio web y la API tienen ciclos de build distintos. El plan, la región y los nombres públicos todavía no están aprobados.

## Decisión

El despliegue previsto, todavía no ejecutado, separa tres piezas:

- Un sitio estático con el build de `apps/web`.
- Un servicio web Node.js con el build de `apps/api`, escuchando en el `PORT` que asigne Render y en `HOST=0.0.0.0`.
- PostgreSQL administrado de Render, inyectando `DATABASE_URL` en la API.

No se añade `render.yaml` en esta fase. Un blueprint aplicable podría crear servicios y una base de datos de pago antes de decidir el plan y la región. La forma prevista está descrita en `docs/deployment/render.md` para revisarla antes de convertirla en configuración.

El desarrollo local sigue en `127.0.0.1`. `trustProxy` permanece desactivado hasta confirmar el proxy de Render; activarlo antes permitiría falsificar la dirección que usa el límite de peticiones.

## Alternativas consideradas

### Un solo servicio que sirva API y estáticos

- Ventajas: un origen y menos configuración CORS.
- Desventajas: acopla el build de Vite al proceso Fastify y mezcla dos tiempos de despliegue.
- Aplazado: puede reconsiderarse si CORS o el coste de dos servicios lo justifican.

### Blueprint de Render desde la fase 1

- Ventajas: la infraestructura quedaría descrita como código.
- Desventajas: los valores de plan, región y comandos de arranque todavía no se han ejecutado en Render.
- Rechazado por ahora: documentar el borrador evita presentar como funcional una configuración no probada.

## Consecuencias

- El despliegue público, el dominio HTTPS y la base administrada siguen pendientes.
- La API local no es alcanzable desde otro dispositivo mientras `HOST` sea `127.0.0.1`.
- CORS no se abre. Se configurará con una lista explícita de orígenes cuando el sitio estático necesite llamar a la API.
