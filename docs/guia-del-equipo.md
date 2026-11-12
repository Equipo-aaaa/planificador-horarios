# Guía del equipo — planificador-horarios

Esta guía explica, en palabras simples, qué vamos a construir, cómo funciona el backtracking con poda y qué dice cada contrato. Léela antes de abrir los contratos: ellos tienen el detalle, aquí está la idea.

## 1. Qué vamos a construir

Una página web que arma horarios para estudiantes de CUCEI. El estudiante:

1. **Elige el ciclo y agrega sus materias,** buscándolas por clave o por nombre. La oferta se descarga de SIIAU.
2. **Ordena las secciones de cada materia** arrastrando fichas: la de arriba es su favorita. Puede descartar una ficha (no la quiere o ya no tiene cupo) o fijarla (la quiere sí o sí).
3. **Elige su turno:** matutino, vespertino, libre o un rango de horas personalizado.
4. **Presiona Generar** y recibe las 3 mejores opciones de horario. Si no hay forma de acomodar todo sin choques, recibe las opciones con menos choques y los ve en rojo.
5. **Ajusta a mano** arrastrando una ficha a la cuadrícula, copia la lista de NRC para el registro de SIIAU o descarga el horario como imagen.

Aparte hay una página de análisis que compara qué tan rápido es el backtracking contra revisar todas las combinaciones, con una gráfica.

Todo corre en el navegador, con HTML, CSS y JavaScript sin frameworks, igual que en los proyectos anteriores. Lo único que corre en un servidor son dos funciones pequeñas en Netlify, que consultan SIIAU, porque SIIAU no deja que otra página lo consulte directamente. Si SIIAU falla, la app usa una copia de la oferta guardada en el repositorio.

## 2. Cómo funciona, con el ejemplo de las 4 materias

Los datos de ejemplo tienen 4 materias inventadas:

| Materia | Secciones (NRC) |
| --- | --- |
| Análisis de Algoritmos | 100001, 100002, 100003 |
| Bases de Datos | 100011, 100012 |
| Redes | 100021, 100022, 100023 |
| Ecuaciones Diferenciales | 100032, 100031 |

Hay 3 × 2 × 3 × 2 = **36 combinaciones** posibles. Con 6 materias de 5 secciones serían 15,625, y por eso no conviene revisarlas todas.

**Paso 1. ¿Chocan?** Dos secciones se empalman si tienen clase el mismo día y sus horas se cruzan. 100001 (lunes y miércoles de 7:00 a 8:55) choca con 100011 (mismos días y horas). Una clase que termina a las 9:00 no choca con una que empieza a las 9:00.

**Paso 2. ¿Qué tan bueno es un horario?** A cada horario le calculamos:

- **Conflictos:** cuántas materias chocan con otra. Lo ideal es 0.
- **Costo:** junta la prioridad y el turno. Cada lugar que una sección está por debajo de la favorita suma 100, y cada minuto de clase fuera del turno suma 1. Así, bajar un lugar en la lista "cuesta" lo mismo que 100 minutos fuera de turno a la semana.
- **Huecos:** minutos muertos entre clases el mismo día.

Se comparan en ese orden: primero menos conflictos, luego menos costo y luego menos huecos. Si todo empata, gana el que tenga los NRC menores; eso casi nunca pasa, pero sirve para que el resultado sea siempre el mismo.

**Paso 3. Búsqueda exhaustiva.** La forma más simple de encontrar las 3 mejores es probar las 36 combinaciones, calcular su puntaje y quedarse con las 3 primeras. Siempre funciona, pero el trabajo se multiplica con cada materia que se agrega.

**Paso 4. Backtracking con poda.** En lugar de llegar siempre hasta el final, el backtracking arma el horario materia por materia y se pregunta en cada paso: *aun en el mejor de los casos, ¿esto puede entrar al top 3?* Para responder usa la **cota optimista**: el costo de lo que ya eligió, más el de la sección más barata de cada materia que falta.

Con turno matutino, 100003 (Análisis por la tarde, tercera en la lista) cuesta 100 × 2 + 230 minutos fuera de turno = 430. Cuando el backtracking llega a ella, ya tiene un top 3 con costos 100, 200 y 200. Aunque todas las demás materias salieran perfectas, cualquier horario con 100003 costaría al menos 430, peor que el tercer lugar. Así que **descarta las 12 combinaciones de esa rama sin revisarlas**.

En este ejemplo, la exhaustiva visita 63 nodos y evalúa 36 horarios; el backtracking visita 29 nodos y evalúa solo 7. Con más materias la diferencia crece muchísimo.

**Paso 5. ¿Cómo sabemos que la poda no tira buenas opciones?** La cota nunca promete menos de lo que la rama puede lograr: agregar materias no quita choques, y cada materia que falta cuesta al menos su sección más barata. Para comprobarlo en la práctica, las pruebas corren las dos búsquedas con los mismos datos: si el backtracking da exactamente el mismo top 3 que la exhaustiva, la poda está bien.

## 3. Qué es un contrato y por qué los usamos

En VisuAlgoritmos, el estándar de eventos permitió que los algoritmos y la animación se programaran por separado; en Huffman lo hicieron los contratos. Aquí es igual: los contratos son acuerdos escritos sobre **qué datos se pasa cada parte** y **con qué forma**.

Si Brayan devuelve las opciones exactamente como dice el contrato y Andrés las dibuja leyéndolas como dice el contrato, ninguno necesita ver el código del otro. Por eso:

- Cada quien puede empezar hoy, sin esperar a los demás.
- Integrar es casi solo conectar piezas.
- **Un contrato no se cambia sin avisar.** Si algo no te cuadra, coméntalo en el grupo o en un PR que modifique primero el documento.

## 4. Los tres contratos, en pocas palabras

### `modelo-datos.md` — cómo se representa cada dato

- **Horas en minutos** desde las 0:00 (7:00 = 420) y **días como números** (0 lunes … 5 sábado), para comparar con `<` sin convertir textos.
- **Una sección es un NRC,** con todas sus sesiones, aunque teoría y laboratorio tengan horarios distintos.
- **Preferencias:** por cada materia, la lista de NRC en orden de preferencia, los descartados y el fijado. La posición en la lista es el **rango** (la favorita tiene rango 0).
- **Problema:** las preferencias ya cruzadas con la oferta, que es lo que recibe el algoritmo.
- **Opción:** un horario completo, con su puntaje y sus empalmes. Las dos búsquedas devuelven hasta 3, junto con cuántos nodos visitaron.

Lo usan: todos.

### `reglas-horario.md` — cómo se decide qué horario es mejor

Las reglas de los pasos 1 a 5 de arriba, escritas con precisión: empalme, conflictos, minutos fuera de turno, huecos, costo, orden de comparación, desempate, cota optimista, cuándo podar y cómo se cuentan las estadísticas. Incluye el ejemplo de poda con números.

La parte más importante es el **desempate final**: sin él, dos opciones empatadas podrían salir en distinto orden en cada búsqueda y las pruebas fallarían sin que haya un error real. Es lo mismo que la regla de desempate del árbol de Huffman.

Lo programa: Diego (núcleo). Lo usan: Brayan (búsquedas), Andrés (pintar empalmes al editar) y las pruebas.

### `contrato-modulos.md` — qué función hace cada quien

Es la lista de funciones que exporta cada integrante: su nombre, qué recibe y qué devuelve. Con esto, quien usa una función sabe cómo llamarla aunque todavía no exista.

Puntos clave:

- **Las vistas se "montan" en un contenedor.** Cada módulo visual tiene una función `montar…` que recibe un elemento de la página y dibuja solo dentro de él.
- **Las vistas no guardan el estado.** Avisan lo que hizo el estudiante y la integración decide qué hacer. Así las preferencias y el horario actual viven en un solo lugar.
- **El núcleo y el algoritmo no tocan la página,** para poder probarlos en Node.
- **Las funciones de SIIAU** (`/api/ciclos` y `/api/oferta`) tienen definido qué responden, incluidos los errores, y el navegador usa el respaldo si fallan.

## 5. Qué leer según tu parte

| Integrante | Lee con calma | Basta con hojear | Primera tarea |
| --- | --- | --- | --- |
| Brayan | Reglas del horario completo; sección "Algoritmo" de módulos | Modelo de datos (Problema, Opción, ResultadoBusqueda) | BR-01, búsqueda exhaustiva |
| Andrés | Modelo de datos (Sección, Preferencias, Opción); sección "Vista" de módulos | Reglas del horario (empalmes) | AN-01, ficha de sección |
| Daniel | Modelo de datos (oferta y Ciclo); sección "Entrada y exportar" de módulos | Reglas del horario | DA-01 a DA-03, repo, Netlify y prueba de SIIAU |
| Diego | Los tres completos, porque programa el núcleo e integra todo | — | DI-01 y DI-02, subir contratos y contexto |

## 6. Los datos de ejemplo

La carpeta `ejemplos/` tiene las 4 materias resueltas en tres escenarios. Sirven para dos cosas: comprobar que tu parte da el resultado correcto y trabajar sin esperar a otros ni a SIIAU.

| Archivo | Qué es | Quién lo usa |
| --- | --- | --- |
| `oferta-ejemplo.json` | Las 4 materias con sus secciones | Todos |
| `escenario-1-*` | Turno matutino: los favoritos de Análisis y Bases de Datos chocan, así que una baja un lugar | Diego, Brayan y Andrés |
| `escenario-1-todas.json` | Las 36 combinaciones con su puntaje y su lugar | Diego, para probar el núcleo una por una |
| `escenario-2-*` | El mismo estudiante con turno vespertino: cambian las opciones | Pruebas del turno |
| `escenario-3-*` | Un choque obligatorio: las opciones salen con 2 materias en conflicto | Pruebas de conflictos; Andrés para pintar en rojo |

Por ejemplo, Andrés puede dibujar la cuadrícula hoy mismo con `escenario-1-resultado.json`, aunque el backtracking todavía no exista. Cuando esté listo, el resultado tiene que ser idéntico al ejemplo.

## 7. Cómo trabajamos

- **Una tarea, una rama, un PR.** La rama lleva el ID de la tarea, por ejemplo `BR-02-backtracking`. Así cada PR es pequeño y fácil de revisar.
- **En GitHub Desktop:**
  1. Ponte en `main` y presiona *Fetch origin* y luego *Pull origin*.
  2. *Current branch → New branch*, con el ID de tu tarea.
  3. Programa y prueba.
  4. Escribe el resumen, presiona *Commit*, luego *Publish branch* y *Create Pull Request*.
  5. En el PR escribe `Closes #n` con el número de tu issue, para que se cierre sola al integrarse.
- **En el tablero,** mueve tu issue a *En progreso* al empezar y a *En revisión* al abrir el PR. Tus tareas van en orden numérico; revisa su "Depende de" antes de empezar. El backlog completo también está en `docs/backlog.md`.
- **Revisiones:** Diego o Daniel revisan y aprueban cada PR, incluidos los suyos.
- **Cada módulo visual tiene su demo** en `demos/`: una página que lo muestra con los datos de ejemplo. Es lo que se abre para revisar tu PR. El núcleo y el algoritmo se prueban en Node.
- **Para probar en tu computadora** usa Live Server de VS Code; con doble clic en el HTML los módulos de JavaScript no funcionan.
- **Trabaja solo en tus carpetas.** Si necesitas algo de otra parte, usa el contrato o los ejemplos.
- **Si usas Claude,** carga el `CLAUDE.md` del repo en las instrucciones de tu proyecto y sube los archivos de `docs/` (contratos, guía y backlog) y los ejemplos. Así te sugiere lo mismo que a los demás.

## 8. Términos que vas a ver

| Término | Qué significa |
| --- | --- |
| NRC | Número que identifica una sección en SIIAU; en la app, una ficha |
| Empalme | Dos clases el mismo día con horas que se cruzan |
| Rango | Posición de una sección en la lista de su materia; la favorita tiene 0 |
| Backtracking | Armar la solución paso a paso y regresar a probar otra opción cuando un camino no sirve |
| Poda | Abandonar un camino del backtracking antes de terminarlo porque ya no puede dar una buena solución |
| Cota optimista | Estimación de lo mejor que podría lograr un horario a medio armar; si ni así entra al top 3, se poda |
| Nodo | Cada vez que el algoritmo coloca una sección en el horario parcial; sirve para medir cuánto trabajó |
| Búsqueda exhaustiva | Probar todas las combinaciones sin saltarse ninguna; lenta pero segura |
| SortableJS | Librería para ordenar elementos arrastrando, también en celular |
| Netlify Function | Función pequeña que corre en el servidor de Netlify cuando la página la llama |
| CORS | Regla del navegador que impide que una página consulte otro sitio sin permiso |
| Respaldo | Copia en JSON de la oferta de SIIAU, guardada en el repo por si SIIAU falla |

Si algo de los contratos no queda claro, pregúntale a Diego antes de programar: es más fácil aclararlo ahora que corregirlo en la integración.
