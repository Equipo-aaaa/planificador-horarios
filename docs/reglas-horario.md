# Contrato: reglas del horario

Este documento fija **cómo se decide qué horario es mejor**: cuándo dos secciones se empalman, cómo se mide el turno y los huecos, cómo se comparan dos opciones y cómo poda el backtracking. Lo programa Diego en el núcleo, y lo usan el algoritmo, la edición manual y las pruebas.

La regla de oro: **el backtracking y la búsqueda exhaustiva deben devolver exactamente el mismo top 3**, en el mismo orden. Para eso, todo lo que está aquí es determinista, incluido el desempate final.

Los números de los ejemplos salen de `ejemplos/escenario-1-*.json`, y se comprobaron con una implementación de referencia.

## 1. Empalme

Dos sesiones se empalman si son el mismo día y sus horas se cruzan:

```
a.dia === b.dia  &&  a.inicio < b.fin  &&  b.inicio < a.fin
```

- Los `<` son estrictos. Una clase que termina a las 9:00 (`540`) **no** choca con una que empieza a las 9:00.
- Dos **secciones** se empalman si alguna sesión de una se empalma con alguna sesión de la otra.

Ejemplo: "Análisis" 100001 (lunes y miércoles de 7:00 a 8:55) y "Bases de Datos" 100011 (mismos días y horas) se empalman dos veces, lunes y miércoles.

## 2. Materias en conflicto

En un horario, una materia está **en conflicto** si su sección se empalma con al menos otra sección del mismo horario. `conflictos` es **cuántas materias** están en conflicto.

En el escenario 3, Análisis choca con Bases de Datos y todo lo demás cabe: `conflictos = 2`.

Si dos materias chocan solo entre sí, cuentan 2. Si tres chocan entre sí, cuentan 3. Cuantas menos, mejor.

## 3. Minutos fuera de turno

Para cada sesión se suman los minutos que caen antes de `turno.inicio` y después de `turno.fin`:

```
max(0, min(s.fin, turno.inicio) - s.inicio)  +  max(0, s.fin - max(s.inicio, turno.fin))
```

`minutosFuera` de una sección es la suma de sus sesiones, y la de un horario es la suma de sus secciones.

Ejemplo con turno matutino (420 a 900): 100003 tiene dos sesiones de 15:00 a 16:55, que caen completas después de las 15:00. Son 115 + 115 = **230 minutos fuera**. Una sesión de 14:00 a 15:55 dejaría 55 minutos fuera.

Con turno libre (0 a 1440), siempre da 0.

## 4. Minutos de huecos

Para cada día, se ordenan las sesiones por `inicio` y se suma el tiempo vacío entre una y la siguiente. Si hay sesiones encimadas (por un empalme), se compara contra el `fin` más tardío visto hasta ahí, para no contar huecos negativos.

Ejemplo, opción 1 del escenario 1:

| Día | Sesiones | Huecos |
| --- | --- | --- |
| Lunes | 7:00–8:55 y 11:00–12:55 | 125 |
| Martes | 9:00–10:55 y 11:00–12:55 | 5 |
| Miércoles | igual que lunes | 125 |
| Jueves | 11:00–12:55 y 13:00–14:55 | 5 |
| Viernes | — | 0 |
| | **Total** | **260** |

## 5. Puntaje y costo

```
prioridad    = suma de los rangos de las secciones elegidas
minutosFuera = suma de minutos fuera de turno
costo        = PESO_PRIORIDAD × prioridad + minutosFuera      (PESO_PRIORIDAD = 100)
conflictos   = materias en conflicto
huecos       = minutos de huecos
```

**Por qué existe `costo`.** Prioridad y turno se combinan en un solo número para que el turno realmente cuente. Si primero se comparara la prioridad y después el turno, el slider casi nunca cambiaría el resultado. Con `PESO_PRIORIDAD = 100`, bajar un lugar en la lista de una materia "cuesta" lo mismo que 100 minutos fuera de turno a la semana. Una sección típica (dos sesiones de casi 2 horas) completamente fuera de turno cuesta 230, más que bajar dos lugares.

`PESO_PRIORIDAD` es una constante del núcleo. Si en las pruebas con estudiantes el turno pesa demasiado o muy poco, solo se cambia ese número.

Cada candidata aporta al costo por su cuenta, y eso es lo que permite calcular la cota de la sección 8:

```
costoCandidata(c, turno) = PESO_PRIORIDAD × c.rango + minutosFueraDeTurno(c.seccion, turno)
```

## 6. Cómo se comparan dos opciones

Se compara campo por campo, y solo se pasa al siguiente si hay empate:

1. **`conflictos`**, menor gana. Un horario sin choques siempre le gana a uno con choques.
2. **`costo`**, menor gana. Combina prioridad y turno.
3. **`huecos`**, menor gana. Es el desempate que pidieron.
4. **Desempate final:** se ordenan las secciones por `clave` de materia (orden alfabético) y se comparan sus NRC uno por uno, como texto. Gana el menor.

El paso 4 casi nunca decide nada, pero es obligatorio. Sin él, dos opciones empatadas podrían salir en distinto orden según el orden en que cada búsqueda las encuentra, y las pruebas que comparan el backtracking con la exhaustiva fallarían sin que haya ningún error real. Es lo mismo que la regla de desempate del árbol de Huffman.

**Modo con conflictos.** No hay un modo aparte. Si ninguna combinación cabe sin choques, las mejores opciones son simplemente las de menos `conflictos`, porque ese es el primer criterio. La página las muestra con los empalmes en rojo.

## 7. Top 3

Las búsquedas guardan las **3 mejores opciones distintas** según la comparación anterior. Se mantiene una lista ordenada de hasta 3. Cada combinación completa se inserta en su lugar y, si la lista pasa de 3, se quita la última.

## 8. Cota optimista y poda

Esta es la parte que hace rápido al backtracking.

El backtracking arma el horario materia por materia. En cada paso tiene unas materias **asignadas** y otras **restantes**. La cota optimista responde: *en el mejor de los casos, ¿qué tan bueno podría llegar a ser un horario que empiece así?*

```
cota.conflictos = materias en conflicto entre las asignadas
cota.costo      = suma de costoCandidata de las asignadas
                + para cada materia restante, el menor costoCandidata de sus candidatas
```

**Regla de poda:** cuando ya hay 3 opciones en el top, sea `peor` la tercera. La rama se abandona si:

```
cota.conflictos > peor.conflictos
o  (cota.conflictos === peor.conflictos  y  cota.costo > peor.costo)
```

**Por qué la poda nunca tira una buena opción.** La cota nunca promete menos de lo que la rama puede lograr:

- Agregar materias no quita conflictos: una materia que ya choca sigue chocando. El horario final tiene al menos `cota.conflictos`.
- Cada materia restante va a costar al menos su candidata más barata, así que el costo final es al menos `cota.costo`.

Si aun en el mejor caso la rama queda peor que la tercera opción, ningún horario de esa rama puede entrar al top 3. Los huecos **no** entran en la cota porque no se pueden acotar: agregar una clase puede rellenar un hueco y bajarlos. Por eso, con empate en conflictos y costo, la rama **no** se poda.

Si la cota prometiera menos de la cuenta, la poda tiraría ramas buenas y el top 3 saldría mal sin avisar. Por eso existen las pruebas contra la búsqueda exhaustiva.

### Ejemplo de poda (escenario 1, turno matutino)

Costo de cada candidata:

| Materia | Candidatas y costo |
| --- | --- |
| IL355 Análisis | 100001 = 0, 100002 = 100, 100003 = 100 × 2 + 230 = **430** |
| IL356 Bases de Datos | 100011 = 0, 100012 = 100 |
| IL357 Redes | 100021 = 0, 100022 = 100, 100023 = 430 |
| MT201 Ecuaciones | 100032 = 0, 100031 = 100 |

Cuando el backtracking llega a probar 100003 para Análisis, ya revisó las ramas de 100001 y 100002, y su top 3 tiene costos 100, 200 y 200, todos sin conflictos. Su cota es:

```
cota.conflictos = 0
cota.costo      = 430 + 0 + 0 + 0 = 430
```

430 > 200, así que **toda la rama de 100003 se poda** sin revisar sus 2 × 3 × 2 = 12 combinaciones.

Resultado en este escenario: la exhaustiva visita 63 nodos y evalúa las 36 combinaciones; el backtracking visita 29 nodos y evalúa solo 7. Con más materias y más secciones la diferencia crece mucho.

### Mejoras permitidas

Brayan puede mejorar la poda siempre que el resultado no cambie:

- Recorrer primero las materias con menos candidatas.
- Calcular la cota de forma incremental en lugar de recalcularla desde cero.

Cualquier mejora debe seguir pasando las pruebas contra la exhaustiva.

## 9. Estadísticas

Ambas búsquedas cuentan lo mismo, de la misma forma, para poder graficarlas juntas:

| Campo | Qué cuenta |
| --- | --- |
| `nodos` | Cuántas veces se coloca una candidata en el horario parcial, en cualquier nivel. Se cuenta al colocarla, antes de revisar la cota. |
| `combinaciones` | Cuántos horarios completos se evaluaron. |
| `ms` | Tiempo de la búsqueda con `performance.now()`, sin contar `construirProblema`. |

En la exhaustiva, `combinaciones` es el producto del número de candidatas de cada materia, y `nodos` es la suma de los productos parciales: 3 + 3·2 + 3·2·3 + 3·2·3·2 = 63 en el escenario 1.

## 10. Escenarios de ejemplo

| Escenario | Qué muestra | Mejor opción |
| --- | --- | --- |
| 1, matutino | Caso normal: los favoritos de Análisis y Bases de Datos (100001 y 100011) chocan, así que una de las dos baja un lugar | 100001, 100012, 100021, 100032 · costo 100 |
| 2, vespertino | El mismo estudiante con turno vespertino: se aceptan secciones de menor prioridad para estudiar en la tarde | 100003, 100011, 100023, 100032 · costo 860 |
| 3, con conflictos | Análisis solo acepta 100001 y Bases de Datos tiene fijada 100011, que chocan: no hay horario sin choques | 100001, 100011, 100021, 100032 · 2 en conflicto |

`escenario-1-todas.json` trae las 36 combinaciones del escenario 1 con su puntaje y su lugar. Sirve para probar el núcleo combinación por combinación.
