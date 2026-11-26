### Las tres estrategias con la oferta real (promedio por problema)

| Materias | Horarios posibles | Exhaustiva: nodos | Exhaustiva: ms | Backtracking: nodos | Backtracking: ms | Voraz: nodos | Voraz: ms | Voraz = backtracking |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 190 | 202 | 0.59 | 36 | 0.020 | 2 | 0.002 | 60 de 100 |
| 3 | 2,659 | 2,861 | 3.05 | 73 | 0.023 | 3 | 0.002 | 47 de 100 |
| 4 | 29,819 | 32,680 | 47.90 | 126 | 0.030 | 4 | 0.001 | 32 de 100 |
| 5 | 366,767 | 399,447 | 333 (91 de 100) | 216 | 0.036 | 6 | 0.002 | 29 de 100 |
| 6 | 4,009,514 | 4,408,961 | 830 (53 de 100) | 408 | 0.076 | 7 | 0.003 | 21 de 100 |
| 7 | 32,949,438 | 37,358,399 | 1,198 (22 de 100) | 858 | 0.15 | 9 | 0.004 | 16 de 100 |
| 8 | 292,756,617 | 330,115,016 | 2,810 (7 de 100) | 1,723 | 0.32 | 11 | 0.007 | 9 de 100 |

Problemas armados con la oferta real (ciclo 202620) y turno matutino: 100 por tamaño, con las semillas 1 a 100 de `generarProblemaAleatorio`. Los nodos son deterministas y salen iguales en cualquier computadora; los tiempos dependen de la computadora (aquí: Node v22.23.4, Intel(R) Xeon(R) Processor @ 2.10GHz).

- **Backtracking:** con las dos mejoras de BR-05 (más secciones primero y cota incremental). El tiempo es el mejor de 5 pasadas por problema.
- **Exhaustiva, nodos:** calculados con la suma de productos parciales. Mientras se ejecutó, el script comprobó que coincide con lo que cuenta la búsqueda y que da el mismo top 3 que el backtracking.
- **Exhaustiva, tiempo:** solo se ejecuta en problemas de hasta 1,000,000 horarios posibles, porque con más congela el navegador. Entre paréntesis, en cuántos de los 100 problemas se midió. El promedio es de esos problemas, que son los más chicos, así que subestima el tiempo real.
- **Voraz = backtracking:** en cuántos problemas la voraz dio exactamente el mismo horario que la mejor opción del backtracking. Nunca fue mejor.

### Detalle

| Materias | Exhaustiva ÷ backtracking (tiempo, mismos problemas) | Backtracking: peor caso (ms) | Voraz: choques que el backtracking evita |
| --- | --- | --- | --- |
| 2 | 30× | 0.13 | 0 de 100 |
| 3 | 133× | 0.074 | 0 de 100 |
| 4 | 1,579× | 0.088 | 0 de 100 |
| 5 | 9,630× | 0.17 | 1 de 100 |
| 6 | 12,760× | 0.43 | 3 de 100 |
| 7 | 12,078× | 1.24 | 4 de 100 |
| 8 | 18,418× | 5.61 | 6 de 100 |

✔ Con 8 materias el backtracking responde en menos de un segundo: el peor de 100 problemas tardó 5.61 ms.
