# ADR-009: Capacitor como extensión futura

## Estado

Aceptado

## Fecha

2026-10-26

## Contexto

La actividad exige una PWA utilizable en Android e iOS. También pide que la arquitectura permita generar más adelante aplicaciones nativas con Capacitor, sin que eso reemplace el manifiesto, el Service Worker ni HTTPS. Flutter está fuera de esta fase. No se deben generar APK, AAB ni IPA todavía.

## Decisión

`apps/mobile` queda como reserva documental. No se instala Capacitor ni se crean proyectos nativos. La interfaz canónica es `apps/web`. Si Capacitor se aprueba, empaquetará ese build en lugar de introducir otra interfaz.

La PWA sigue siendo el requisito de entrega. Una aplicación de tienda, si llega a existir, será una extensión.

## Alternativas consideradas

### Iniciar Capacitor en la fase 1

- Ventajas: detectaría pronto una incompatibilidad con Vite.
- Desventajas: genera proyectos Android e iOS que el encargo prohíbe y añade un ciclo de build nativo sin un requisito actual.
- Rechazado.

### Flutter

- Ventajas: una base nativa única.
- Desventajas: el encargo lo excluye y abandonaría la PWA en React.
- Rechazado.

## Consecuencias

- Los agentes no crean `android/` ni `ios/` salvo una decisión posterior que sustituya este ADR.
- Las pruebas de navegador en Chrome para Android y Safari para iOS siguen siendo necesarias aunque exista una extensión nativa.
