# Matriz de decisión

Fecha de la ponderación: 2026-10-26.

Esta matriz compara arquitecturas de producto para técnicos que registran reportes en zonas con conectividad irregular, desde teléfonos Android e iOS. Las puntuaciones son un juicio de diseño. No salen de una medición en dispositivos ni de una instalación PWA, porque esa instalación todavía no existe.

Una API REST no es una de esas interfaces. Es el canal por el que un cliente confirma datos en el servidor. Puede acompañar a una web, a una PWA, a una aplicación nativa o a una multiplataforma. Por eso aparece en la comparación como arquitectura de servicio, no como sustituto de la pantalla que el técnico usa en el campo.

## Escala

Cada criterio vale de 0 a 3:

| Puntos | Significado                                                                |
| ------ | -------------------------------------------------------------------------- |
| 0      | No cubre el criterio                                                       |
| 1      | Lo cubre con una carencia que impide el escenario                          |
| 2      | Lo cubre con una limitación documentada                                    |
| 3      | Lo cubre para el escenario descrito, dentro de lo que la plataforma ofrece |

## Pesos

El peso sigue la importancia del criterio para este encargo, no una preferencia genérica por las PWA.

| Criterio                      | Peso | Justificación                                                                                                                 |
| ----------------------------- | ---: | ----------------------------------------------------------------------------------------------------------------------------- |
| Funcionamiento sin conexión   |    3 | El problema que origina el proyecto es perder el reporte cuando desaparece la red.                                            |
| Instalación y distribución    |    2 | El técnico debe poder instalar desde el navegador, sin depender de una tienda ni de una cuenta de desarrollador.              |
| Compatibilidad Android e iOS  |    3 | La actividad exige ambos sistemas. Una solución que deje uno fuera no cumple el escenario.                                    |
| Capacidades del dispositivo   |    1 | El alcance actual es el reporte. Cámara, GPS u otras APIs nativas pueden aparecer después y no deciden la arquitectura.       |
| Mantenimiento y reutilización |    2 | El equipo mantiene una web y una API. Un segundo cliente nativo multiplica el trabajo antes de tener el flujo de campo.       |
| Complejidad de desarrollo     |    2 | El repositorio ya tiene React y Vite. Descartar ese cliente para empezar otro aumenta el riesgo sin resolver la conectividad. |

El máximo ponderado es 39. La columna de adecuación no se puntúa otra vez: es la lectura del total.

## Comparación

| Criterio                      | Web tradicional | Servicio o API, sin cliente completo | PWA | Nativa | Multiplataforma |
| ----------------------------- | --------------: | -----------------------------------: | --: | -----: | --------------: |
| Sin conexión                  |               0 |                                    0 |   2 |      3 |               3 |
| Instalación y distribución    |               1 |                                    0 |   2 |      1 |               1 |
| Android e iOS                 |               3 |                                    1 |   2 |      1 |               2 |
| Capacidades del dispositivo   |               1 |                                    0 |   2 |      3 |               3 |
| Mantenimiento y reutilización |               3 |                                    2 |   3 |      1 |               2 |
| Complejidad de desarrollo     |               3 |                                    2 |   2 |      1 |               1 |
| Total ponderado               |              24 |                                   11 |  28 |     21 |              26 |

### Cómo se obtiene cada total

- Web tradicional: `(0 × 3) + (1 × 2) + (3 × 3) + (1 × 1) + (3 × 2) + (3 × 2) = 24`.
- Servicio o API sin cliente: `(0 × 3) + (0 × 2) + (1 × 3) + (0 × 1) + (2 × 2) + (2 × 2) = 11`.
- PWA: `(2 × 3) + (2 × 2) + (2 × 3) + (2 × 1) + (3 × 2) + (2 × 2) = 28`.
- Nativa: `(3 × 3) + (1 × 2) + (1 × 3) + (3 × 1) + (1 × 2) + (1 × 2) = 21`.
- Multiplataforma: `(3 × 3) + (1 × 2) + (2 × 3) + (3 × 1) + (2 × 2) + (1 × 2) = 26`.

## Lectura de cada opción

La web tradicional llega a cualquier navegador y reutiliza un solo código, pero cada pantalla depende de la red. Un marcador no es la instalación que pide la actividad.

El servicio o API conserva los reportes confirmados y puede servir a cualquier cliente futuro. Sin una interfaz en el teléfono no hay instalación, ni borrador local, ni uso en campo. Su puntuación baja no rechaza la API: rechaza usarla como si fuera la aplicación del técnico. En este proyecto la API Fastify sigue siendo necesaria y ya responde `GET /health`.

La PWA mantiene el cliente React, publica manifiesto, iconos y Service Worker, y guarda reportes en IndexedDB. No recibe 3 en funcionamiento sin conexión porque la persistencia del navegador no es una garantía: WebKit puede desalojar almacenamiento y Safari en iOS no ofrece Background Sync. Tampoco recibe 3 en instalación porque Chrome para Android y Safari para iOS usan recorridos distintos, documentados en [browser-compatibility.md](browser-compatibility.md), y ninguno se ha probado en un teléfono.

La aplicación nativa cubre mejor el almacenamiento local y las APIs del teléfono. Cubre peor la distribución: harían falta tiendas o paquetes separados y el código actual de `apps/web` dejaría de ser el cliente. La actividad pide una PWA, no un reemplazo nativo.

La opción multiplataforma, por ejemplo Capacitor o un toolkit nativo, puede compartir lógica y acceder al dispositivo. Sigue dependiendo de proyectos nativos y de una distribución distinta de la instalación por navegador. ADR-009 deja Capacitor como extensión posterior y prohíbe que sustituya a la PWA. `apps/mobile` continúa vacío.

## Decisión

Para este escenario la PWA es la opción más adecuada, con 28 puntos frente a 26 de la alternativa multiplataforma. La diferencia está en la instalación desde el navegador y en reutilizar el cliente que ya existe. Si el encargo pasara a exigir ejecución en segundo plano fiable o una API de hardware que la web no ofrezca, la puntuación nativa o multiplataforma debería recalcularse antes de cambiar de arquitectura.

La decisión no afirma que la PWA esté terminada. La interfaz puede precachearse y la cola local existe. No hay prueba de instalación en un teléfono.
