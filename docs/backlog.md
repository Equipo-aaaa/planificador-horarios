# Backlog — planificador-horarios

Actualizado el 12/11/2026. Si cambia una tarea, se actualiza aquí y en su issue.

## Calendario

El código se termina el martes 17 de noviembre en la noche, para llegar a la revisión de avances (del 17 al 20 de noviembre) con la app completa. Después solo quedan las correcciones del profesor, la prueba con estudiantes y los documentos. Son 37 tareas en un repositorio nuevo, independiente de VisuAlgoritmos y de Huffman. Cada tarea es un PR que se prueba solo con su demo o sus pruebas.

| Etapa | Fechas | Hito al cerrar |
| --- | --- | --- |
| Sprint 1 | jue 12 al sáb 14 nov | Página publicada; SIIAU responde desde Netlify; núcleo terminado; el backtracking da el top 3 de los escenarios de ejemplo; la cuadrícula y las listas funcionan con los datos de ejemplo |
| Sprint 2 | dom 15 al mar 17 nov | Flujo completo en la URL pública: buscar materias, ordenar fichas, generar, editar, copiar NRC y exportar; página de análisis con la gráfica |
| Cierre | mié 18 al vie 20 nov | Prueba con estudiantes, limpieza, README y deploy final |

Todo vive en el repositorio Equipo-aaaa/planificador-horarios. Cada integrante trabaja solo en su parte y respeta los tres contratos (modelo de datos, reglas del horario y módulos). Diego y Daniel revisan y aprueban los PR de todos, incluidos los propios.

Si algo se atrasa, lo primero que puede pasar al Cierre sin afectar la demo es: el filtro por carrera, exportar imagen, guardar el avance y las mejoras de poda.

## Sprint 1 — Base, núcleo y primeras vistas (12 al 14 nov)

Al cerrar el sábado 14, la página está publicada, SIIAU responde desde Netlify y el backtracking da el top 3 correcto de los escenarios de ejemplo. Brayan y Andrés avanzan en paralelo con los datos de ejemplo, sin esperar a SIIAU.

### DA-01 · Crear el repositorio y el tablero

**¿Qué se hará?** Crear el repositorio planificador-horarios en la organización Equipo-aaaa, proteger la rama principal y dar acceso a los cuatro integrantes. Después, crear el tablero "Planificador" en GitHub Projects ligado a ese repositorio, configurar sus columnas, los campos Sprint y Fecha y las etiquetas, y cargar en él las tareas del backlog.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 12/11/2026

**Definition of Done:**

- Columnas Backlog, Por hacer, En progreso, En revisión y Terminado
- La rama principal está protegida y los cuatro integrantes tienen acceso
- Las 37 tareas cargadas con responsable, sprint y fecha

### DI-01 · Subir contratos y datos de ejemplo

**¿Qué se hará?** Subir al repositorio los tres contratos (modelo de datos, reglas del horario y módulos) y los datos de ejemplo de las cuatro materias con sus tres escenarios, para que todos trabajen con las mismas reglas desde el inicio.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 12/11/2026

**Depende de:** DA-01

**Definition of Done:**

- Los 3 contratos y los archivos de ejemplo están en main
- Los 4 integrantes leyeron los contratos y aprobaron el PR
- Código subido, con PR revisado y sin errores

### DI-02 · Subir CLAUDE.md y guía del equipo

**¿Qué se hará?** Subir el CLAUDE.md con el contexto del proyecto, el reparto y las reglas de trabajo, junto con una guía que explique en palabras simples qué se construye, cómo funciona el backtracking con poda y qué dice cada contrato, para que el asistente de cada integrante parta del mismo contexto.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 12/11/2026

**Depende de:** DI-01

**Definition of Done:**

- CLAUDE.md está en la raíz del repositorio y la guía junto a los contratos
- Cada integrante lo cargó en su Claude
- Código subido, con PR revisado y sin errores

### DA-02 · Conectar Netlify al repositorio

**¿Qué se hará?** Crear el sitio en Netlify conectado al repositorio, para que se publique automáticamente con cada cambio en GitHub, y agregar la configuración que publica las funciones del servidor y les dirige las peticiones de la página.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 12/11/2026

**Depende de:** DA-01

**Definition of Done:**

- Cada merge a main publica el sitio solo
- Cada PR genera una vista previa
- Código subido, con PR revisado y sin errores

### DA-03 · Comprobar que SIIAU responde desde Netlify

**¿Qué se hará?** Programar una primera función de Netlify que envíe el formulario de consulta de oferta de SIIAU para una clave de materia de CUCEI y devuelva el HTML de resultados, para confirmar el primer día que SIIAU no bloquea las peticiones que vienen de Netlify, como pasó con Gutendex.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 12/11/2026

**Depende de:** DA-02

**Definition of Done:**

- En el sitio publicado, la función devuelve la tabla de oferta de una materia real
- Se anotó en el PR cómo vienen las columnas de SIIAU (horas, días, profesor, cupos)
- Si SIIAU bloquea a Netlify, se avisó al equipo el mismo día

### DI-03 · Detectar empalmes

**¿Qué se hará?** Programar las funciones del núcleo que deciden si dos secciones se empalman, listan cada empalme de un horario con su día y su tramo exacto, y cuentan cuántas materias quedan en conflicto, que es la base del algoritmo y de la edición manual.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DI-01

**Definition of Done:**

- Una clase que termina a las 9:00 no choca con una que empieza a las 9:00
- En el escenario 3, Análisis y Bases de Datos dan 2 empalmes y 2 materias en conflicto
- Código subido, con PR revisado y sin errores

### DI-04 · Puntaje y comparación de opciones

**¿Qué se hará?** Programar el cálculo de los minutos fuera de turno, los minutos de huecos y el costo de cada horario, junto con la comparación que decide cuál de dos opciones es mejor, incluido el desempate por NRC que hace que las dos búsquedas den el mismo orden.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DI-03

**Definition of Done:**

- Las 36 combinaciones del escenario 1 dan el mismo puntaje y el mismo lugar que el ejemplo
- Las pruebas del núcleo corren en Node
- Código subido, con PR revisado y sin errores

### DI-05 · Cota optimista, armado del problema y edición

**¿Qué se hará?** Programar la cota optimista que estima lo mejor que puede lograr un horario a medio armar y la regla que decide cuándo podar, la función que cruza la oferta con las preferencias para armar el problema (respetando fijadas y descartadas) y la que cambia una sección de una opción y la vuelve a evaluar para la edición manual.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DI-04

**Definition of Done:**

- En el escenario 1, la cota al probar la sección 100003 da 430 y la regla indica podar
- Los 3 escenarios arman el problema esperado, incluida la sección fijada del escenario 3
- Código subido, con PR revisado y sin errores

### BR-01 · Búsqueda exhaustiva

**¿Qué se hará?** Programar el recorrido recursivo que prueba todas las combinaciones posibles, una sección por materia, guarda las 3 mejores y cuenta nodos, combinaciones y tiempo. Mientras el núcleo no esté listo, se usan versiones provisionales de sus funciones con las firmas del contrato.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DI-01

**Definition of Done:**

- Los 3 escenarios dan el top 3 del ejemplo
- En el escenario 1 cuenta 63 nodos y 36 combinaciones
- Código subido, con PR revisado y sin errores

### AN-01 · Ficha de sección

**¿Qué se hará?** Programar la ficha que muestra una sección con su materia, NRC, profesor, días, horas y cupo, con un aspecto distinto si está fijada, descartada o en conflicto, incluyendo su demo.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DI-01

**Definition of Done:**

- Su demo muestra una ficha en cada estado con los datos de ejemplo
- El cupo aparece junto a la hora en que se descargó la oferta
- Código subido, con PR revisado y sin errores

### DA-04 · Función de ciclos

**¿Qué se hará?** Programar la función de Netlify que lee el formulario de SIIAU y devuelve los tres ciclos más recientes, para que el estudiante pueda elegir entre el anterior, el actual y el próximo cuando ya aparezca.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 13/11/2026

**Depende de:** DA-03

**Definition of Done:**

- En el sitio publicado devuelve los 3 ciclos en el formato del contrato
- Código subido, con PR revisado y sin errores

### DI-06 · Esqueleto de la página

**¿Qué se hará?** Crear la página principal con el diseño base del sitio, los estilos comunes y un contenedor vacío por módulo (panel de entrada, listas de prioridad, cuadrícula y opciones), para que cada integrante monte su parte sin tocar el HTML de los demás.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 14/11/2026

**Depende de:** DA-02

**Definition of Done:**

- La página publicada muestra el diseño y los cuatro contenedores
- Se ve bien en computadora y en celular
- Código subido, con PR revisado y sin errores

### BR-02 · Backtracking con poda

**¿Qué se hará?** Programar el backtracking que arma el horario materia por materia y abandona una rama en cuanto la cota optimista indica que ya no puede entrar al top 3, que es la búsqueda que usa la app.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 14/11/2026

**Depende de:** BR-01, DI-05

**Definition of Done:**

- Los 3 escenarios dan exactamente el mismo top 3 que la exhaustiva
- En el escenario 1 visita menos nodos que la exhaustiva
- Código subido, con PR revisado y sin errores

### AN-02 · Cuadrícula del horario

**¿Qué se hará?** Programar la cuadrícula semanal de lunes a sábado, de 7:00 a 21:00, que coloca las fichas de una opción en su día y su hora y pinta en rojo los tramos donde hay empalme, incluyendo su demo.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 14/11/2026

**Depende de:** AN-01

**Definition of Done:**

- Su demo dibuja las opciones de los escenarios 1 y 3
- Los empalmes del escenario 3 aparecen en rojo el lunes y el miércoles
- Código subido, con PR revisado y sin errores

### AN-03 · Listas de prioridad

**¿Qué se hará?** Programar una lista por materia con sus fichas, que el estudiante reordena arrastrando con SortableJS para indicar sus secciones favoritas, avisando a la página cada vez que cambian las preferencias, incluyendo su demo.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 14/11/2026

**Depende de:** AN-01

**Definition of Done:**

- Su demo muestra las listas del escenario 1 y se pueden reordenar en computadora y en celular
- Cada cambio imprime en consola las preferencias nuevas con el formato del contrato
- Código subido, con PR revisado y sin errores

### DA-05 · Función de oferta

**¿Qué se hará?** Programar la función de Netlify que busca materias de CUCEI en SIIAU por clave o por nombre, con filtro opcional por carrera, recorre todas las páginas de resultados, junta las filas de un mismo NRC en una sola sección y convierte horas y días al formato del contrato.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 1 (Del 12/11/2026 al 14/11/2026), a más tardar el 14/11/2026

**Depende de:** DA-04

**Definition of Done:**

- En el sitio publicado, buscar por clave y por nombre devuelve materias reales en el formato del contrato
- Una sección con teoría y laboratorio en horarios distintos sale como una sola sección con varias sesiones
- Código subido, con PR revisado y sin errores

## Sprint 2 — Flujo completo e integración (15 al 17 nov)

Al cerrar el martes 17 en la noche, el flujo completo funciona en la URL pública y el código queda congelado. Diego integra cada PR en cuanto se aprueba, así que DI-09 solo conecta lo que falte.

### BR-03 · Problemas aleatorios

**¿Qué se hará?** Programar la función que arma un problema con un número dado de materias elegidas al azar de la oferta, que con la misma semilla siempre da el mismo problema, para que las pruebas y las mediciones se puedan repetir.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** DI-05

**Definition of Done:**

- Con la misma semilla devuelve el mismo problema
- Funciona con la oferta de ejemplo y con el respaldo real
- Código subido, con PR revisado y sin errores

### BR-04 · Pruebas del algoritmo

**¿Qué se hará?** Escribir las pruebas automáticas que comprueban que el backtracking da exactamente el mismo top 3 que la búsqueda exhaustiva, que los escenarios dan el resultado esperado y que las opciones generadas no tienen empalmes cuando existe un horario sin choques.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** BR-02, BR-03

**Definition of Done:**

- Pasan en Node
- Cubren los 3 escenarios y al menos 200 problemas aleatorios
- Código subido, con PR revisado y sin errores

### DI-07 · Generar y mostrar las opciones

**¿Qué se hará?** Programar en la página el botón Generar, que arma el problema con las preferencias, corre el backtracking y muestra las tres opciones en pestañas con su puntaje, avisando qué materias chocan o se quedaron sin secciones.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** DI-06, BR-02, AN-02

**Definition of Done:**

- Con los datos de ejemplo, las pestañas muestran las 3 opciones de cada escenario en la cuadrícula
- El escenario 3 avisa que Análisis y Bases de Datos chocan
- Código subido, con PR revisado y sin errores

### AN-04 · Descartar, recuperar y fijar fichas

**¿Qué se hará?** Agregar a las listas de prioridad una zona de descartadas y los controles para descartar una ficha, recuperarla o fijarla, para cuando una sección no le interesa al estudiante o se queda sin cupo durante el registro.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** AN-03

**Definition of Done:**

- Fijar una ficha quita la fijada anterior de esa materia
- Una ficha descartada no se puede fijar
- Código subido, con PR revisado y sin errores

### AN-05 · Gráfica de tiempos

**¿Qué se hará?** Programar con Chart.js la gráfica que compara el backtracking y la exhaustiva, con el tiempo y los nodos visitados contra el número de materias, incluyendo su demo con mediciones inventadas.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** DI-01

**Definition of Done:**

- Su demo muestra las dos gráficas con una línea por algoritmo
- Código subido, con PR revisado y sin errores

### DA-06 · Respaldo de la oferta

**¿Qué se hará?** Programar un script que descargue de SIIAU la oferta de las carreras del equipo para el ciclo actual y la guarde como JSON en el repositorio, para que la app siga funcionando si SIIAU se cae o bloquea a Netlify el día de la presentación.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** DA-05

**Definition of Done:**

- El JSON del ciclo actual está en main con el formato del contrato
- El README explica cómo volver a generarlo
- Código subido, con PR revisado y sin errores

### DA-07 · Búsqueda de materias con respaldo

**¿Qué se hará?** Programar las funciones del navegador que piden los ciclos y buscan materias a las funciones de Netlify y, si estas fallan, usan el respaldo guardado en el repositorio, para que el resto de la página no tenga que saber de dónde vienen los datos.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 15/11/2026

**Depende de:** DA-06

**Definition of Done:**

- Con las funciones apagadas, la búsqueda devuelve resultados del respaldo marcados como tales
- Código subido, con PR revisado y sin errores

### DI-08 · Guardar el avance

**¿Qué se hará?** Guardar en el navegador las materias agregadas, las preferencias y la última opción cada vez que cambian, y restaurarlas al abrir la página, para que el estudiante no pierda su trabajo al recargar.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** DI-07

**Definition of Done:**

- Al recargar se recuperan las listas, el turno y la opción mostrada
- Un avance dañado o de otra versión se ignora sin romper la página
- Código subido, con PR revisado y sin errores

### AN-06 · Edición manual del horario

**¿Qué se hará?** Permitir arrastrar una ficha de las listas de prioridad a la cuadrícula para cambiar la sección de esa materia en el horario mostrado, avisando a la página para que lo vuelva a evaluar y pinte en rojo lo que choque.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** AN-02, AN-04

**Definition of Done:**

- En su demo, soltar una ficha en la cuadrícula reemplaza la sección de su materia
- Si la sección nueva choca, el empalme aparece en rojo
- Funciona en computadora y en celular
- Código subido, con PR revisado y sin errores

### DA-08 · Panel de entrada

**¿Qué se hará?** Programar el panel donde el estudiante elige el ciclo, busca materias por clave o por nombre, filtra por carrera, agrega las materias que quiere cursar y quita las que ya no, incluyendo su demo.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** DA-07

**Definition of Done:**

- Su demo busca, agrega y quita materias e imprime en consola cada aviso
- Si los datos vienen del respaldo, el panel lo indica
- Código subido, con PR revisado y sin errores

### DA-09 · Selector de turno

**¿Qué se hará?** Agregar al panel de entrada la elección de turno: matutino de 7:00 a 15:00, vespertino de 15:00 a 21:00, libre, y personalizado con un slider de rango en pasos de 30 minutos.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** DA-08

**Definition of Done:**

- Cada opción avisa a la página el turno con el formato del contrato
- Los turnos fijos mueven el slider a su rango
- Código subido, con PR revisado y sin errores

### BR-05 · Mejoras de poda

**¿Qué se hará?** Hacer más rápido el backtracking sin cambiar su resultado, recorriendo primero las materias con menos secciones y calculando la cota de forma incremental, y medir cuántos nodos se ahorran.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** BR-04

**Definition of Done:**

- Las pruebas contra la exhaustiva siguen pasando
- El PR muestra los nodos antes y después con los mismos problemas
- Código subido, con PR revisado y sin errores

### AN-07 · Página de análisis

**¿Qué se hará?** Armar la página que genera problemas aleatorios con la oferta real, corre las dos búsquedas con un rango de materias y un número de repeticiones elegidos por el usuario, y muestra los resultados en la gráfica de tiempos.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 16/11/2026

**Depende de:** AN-05, BR-03, DA-06

**Definition of Done:**

- La página publicada mide de 2 a 8 materias y grafica los dos algoritmos
- La exhaustiva tiene un límite de materias para no congelar la página
- Código subido, con PR revisado y sin errores

### DA-10 · Copiar NRC y exportar imagen

**¿Qué se hará?** Programar el botón que copia al portapapeles la lista de NRC del horario mostrado, uno por línea con el nombre de su materia, para pegarla en el registro de SIIAU, y el que descarga la cuadrícula como imagen.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 17/11/2026

**Depende de:** AN-02

**Definition of Done:**

- El texto copiado tiene un NRC por línea en el orden de las materias
- La imagen descargada muestra la cuadrícula completa y legible
- Código subido, con PR revisado y sin errores

### DI-09 · Integración completa

**¿Qué se hará?** Conectar en la página los módulos que falten (panel de entrada, turno, edición manual, copiar y exportar) y probar el flujo completo con la oferta real en el sitio publicado.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 17/11/2026

**Depende de:** DI-08, AN-06, DA-09, DA-10

**Definition of Done:**

- En la URL pública funciona buscar → ordenar → generar → editar → copiar NRC
- Cambiar el turno cambia las opciones generadas
- Código subido, con PR revisado y sin errores

### BR-06 · Medir con la oferta real

**¿Qué se hará?** Medir el tiempo y los nodos de las dos búsquedas con problemas armados de la oferta real, de 2 a 8 materias, y registrar los resultados en una tabla para el README y la evaluación del proyecto.

**¿Quién lo hará?** Brayan

**¿Cuándo se hará?** Sprint 2 (Del 15/11/2026 al 17/11/2026), a más tardar el 17/11/2026

**Depende de:** BR-05, DA-06

**Definition of Done:**

- Tabla con materias, combinaciones posibles, nodos y tiempo de cada búsqueda
- Con 8 materias el backtracking responde en menos de un segundo
- La tabla está lista para pegarse en el README

## Cierre — Evaluación y entrega (18 al 20 nov)

Del miércoles 18 en adelante no se agregan funciones: se aplican las correcciones del profesor, se prueba con estudiantes, se limpia, se documenta y se publica la versión final.

### AN-08 · Diseñar la prueba con estudiantes

**¿Qué se hará?** Preparar la prueba que evalúa la herramienta con estudiantes de CUCEI: el caso que cada uno debe resolver (materias y preferencias), cómo se cronometra armarlo a mano y con la app, el formato para registrar los tiempos y un cuestionario breve de satisfacción.

**¿Quién lo hará?** Andrés

**¿Cuándo se hará?** Cierre (Del 18/11/2026 al 20/11/2026), a más tardar el 18/11/2026

**Depende de:** DI-09

**Definition of Done:**

- El caso, el formato de registro y el cuestionario están en el repositorio
- El equipo los revisó antes de aplicarlos

### TO-01 · Limpieza del código

**¿Qué se hará?** Que cada integrante revise sus carpetas y quite código muerto, mensajes de depuración, funciones provisionales y archivos de prueba que ya no se usen antes de la entrega.

**¿Quién lo hará?** Todos

**¿Cuándo se hará?** Cierre (Del 18/11/2026 al 20/11/2026), a más tardar el 18/11/2026

**Depende de:** DI-09

**Definition of Done:**

- Cada integrante abrió un PR de limpieza de sus carpetas
- Las pruebas del núcleo y del algoritmo siguen pasando
- Código subido, con PR revisado y sin errores

### TO-02 · Aplicar la prueba con estudiantes

**¿Qué se hará?** Aplicar la prueba a compañeros de CUCEI, registrar cuánto tardan en armar su horario a mano y con la app, y juntar las respuestas del cuestionario, para demostrar que la herramienta reduce el tiempo y los errores.

**¿Quién lo hará?** Todos

**¿Cuándo se hará?** Cierre (Del 18/11/2026 al 20/11/2026), a más tardar el 19/11/2026

**Depende de:** AN-08

**Definition of Done:**

- Cada integrante aplicó la prueba al menos a 2 estudiantes
- Los tiempos y las respuestas están en una tabla lista para el README

### DI-10 · README

**¿Qué se hará?** Escribir el README del proyecto: qué problema resuelve, cómo se usa, cómo está organizado, cómo funciona el backtracking con poda, los resultados de las mediciones y de la prueba con estudiantes, y la declaración de uso de IA.

**¿Quién lo hará?** Diego

**¿Cuándo se hará?** Cierre (Del 18/11/2026 al 20/11/2026), a más tardar el 20/11/2026

**Depende de:** BR-06, TO-02

**Definition of Done:**

- Incluye la tabla de mediciones y la de la prueba con estudiantes
- Incluye capturas de la página principal y de la de análisis
- Código subido, con PR revisado y sin errores

### DA-11 · Revisión final y deploy

**¿Qué se hará?** Revisar la versión final en main, actualizar el respaldo de la oferta si cambió, publicarla y probar el sitio completo en computadora y en celular antes de entregar.

**¿Quién lo hará?** Daniel

**¿Cuándo se hará?** Cierre (Del 18/11/2026 al 20/11/2026), a más tardar el 20/11/2026

**Depende de:** TO-01, DI-10

**Definition of Done:**

- La URL pública funciona en escritorio y en un teléfono, con el flujo completo
- Existe el tag v1.0 en main

## Reparto

| Integrante | Tareas | Parte |
| --- | --- | --- |
| Daniel | DA-01 a DA-11 (11) | Repositorio, Netlify, SIIAU, respaldo, panel de entrada, turno, copiar NRC y exportar; revisa y aprueba PR |
| Diego | DI-01 a DI-10 (10) | Contratos, núcleo (empalmes, puntaje, cota), esqueleto, generar opciones, guardar avance, integración y README; revisa y aprueba PR |
| Andrés | AN-01 a AN-08 (8) | Ficha, cuadrícula, listas de prioridad, edición manual, gráfica, página de análisis y diseño de la prueba con estudiantes |
| Brayan | BR-01 a BR-06 (6) | Búsqueda exhaustiva, backtracking con poda, pruebas, mejoras de poda y mediciones |
| Todos | TO-01 y TO-02 (2) | Limpieza y prueba con estudiantes |

Daniel y Andrés tienen más tareas porque varias son pequeñas; las de Brayan son menos pero las más difíciles en lo conceptual.

## Cómo cargarlo en GitHub Projects

Una issue por tarea en el tablero "Planificador", ligado al repo planificador-horarios.

- **Título:** ID y nombre, por ejemplo BR-02 · Backtracking con poda.
- **Cuerpo:** ¿Qué se hará?, la Definition of Done como casillas - [ ] y una línea "Depende de: #n".
- **Assignee:** el responsable; TO-01 y TO-02 se asignan a los cuatro.
- **Sprint** (campo Iteration): Sprint 1 del 12 al 14 nov, Sprint 2 del 15 al 17 nov, Cierre del 18 al 20 nov.
- **Fecha** (campo Date): la de "a más tardar".
- **Etiquetas:** opcionales, por ejemplo una por parte del proyecto (núcleo, algoritmo, SIIAU, vista, interfaz).
- **Rama y PR:** con el ID en el nombre (BR-02-backtracking) y "Closes #n" en el PR, para que la issue pase sola a Terminado.
