# Datos de ejemplo

Cuatro materias inventadas (Análisis de Algoritmos, Bases de Datos, Redes y Ecuaciones Diferenciales), con 3, 2, 3 y 2 secciones: 36 combinaciones posibles. Los resultados se generaron con una implementación de referencia, y en los tres escenarios el backtracking y la exhaustiva dieron el mismo top 3.

| Archivo | Qué es | Quién lo usa |
| --- | --- | --- |
| `oferta-ejemplo.json` | `RespuestaOferta` con las 4 materias (`fuente: "ejemplo"`) | Todos, para trabajar sin SIIAU |
| `escenario-1-preferencias.json` | Turno matutino, sin descartes | Andrés (listas), Diego (núcleo), Brayan (pruebas) |
| `escenario-1-resultado.json` | Top 3 esperado y estadísticas de las dos búsquedas | Brayan (pruebas), Andrés (cuadrícula) |
| `escenario-1-todas.json` | Las 36 combinaciones con su puntaje y su lugar | Diego, para probar el núcleo una por una |
| `escenario-2-*.json` | El mismo estudiante con turno vespertino | Pruebas del turno |
| `escenario-3-*.json` | Análisis solo acepta 100001 y Bases de Datos tiene fijada 100011: hay choque obligatorio | Pruebas del modo con conflictos; Andrés para pintar empalmes |

Las estadísticas de los resultados solo traen `nodos` y `combinaciones`; `ms` cambia en cada computadora.
