# Contrato: módulos

Este documento fija **qué funciones entrega cada integrante**: su nombre, qué recibe y qué devuelve. Con esto, quien usa una función sabe cómo llamarla aunque todavía no exista, y puede trabajar con los datos de `ejemplos/` mientras tanto.

Las formas de los datos (`Seccion`, `Opcion`, `Problema`…) están en `modelo-datos.md`. Las reglas de empalme, puntaje y poda están en `reglas-horario.md`.

## Tecnología y reglas generales

- HTML, CSS y JavaScript **sin frameworks**, con Bootstrap 5 y Bootstrap Icons, como VisuAlgoritmos. El diseño es libre: esta vez el sitio es independiente.
- Módulos de JavaScript (`import` / `export`). El repo tiene `package.json` con `"type": "module"` para que los módulos puros también corran en Node.
- Librerías por CDN, cargadas con `<script>` en el HTML y usadas como variables globales:

  | Librería | Global | La usa |
  | --- | --- | --- |
  | SortableJS | `Sortable` | Andrés |
  | html2canvas | `html2canvas` | Daniel |
  | Chart.js | `Chart` | Andrés |

- **Cada módulo visual se "monta" en un contenedor.** Su función `montar…` recibe un elemento de la página y dibuja solo dentro de él. Nadie toca el HTML de otro.
- **Los módulos visuales no guardan el estado de la app.** Avisan lo que hizo el estudiante con callbacks y la integración (Diego) decide qué hacer. Así hay un solo lugar donde viven las preferencias y el horario actual.
- **Los módulos puros** (`nucleo/`, `algoritmo/`) no tocan el DOM, para que se puedan probar en Node.

## Estructura del repositorio

```
index.html                 página principal (Diego: esqueleto)
analisis.html              página de análisis (Andrés)
css/estilos.css            paleta, tipografía y estilos comunes (Diego)
css/modulos/               un CSS por módulo, para no editar el mismo archivo
js/nucleo/                 Diego: modelo, reglas, cota
js/algoritmo/              Brayan: backtracking, exhaustiva, problemas aleatorios
js/vista/                  Andrés: ficha, listas, cuadrícula, gráfica
js/entrada/                Daniel: oferta, panel de entrada, exportar
js/app/                    Diego: integración, estado, guardado
js/analisis/               Andrés: lógica de la página de análisis
netlify/functions/         Daniel: ciclos y oferta
datos/                     Daniel: JSON de respaldo de la oferta
demos/                     una página por módulo visual, con los datos de ejemplo
tests/                     pruebas del núcleo y del algoritmo
ejemplos/                  datos resueltos de este contrato
docs/                      contratos y guía
```

## Núcleo — Diego (`js/nucleo/`)

Funciones puras. Las usan el algoritmo, la edición manual y las pruebas.

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `TURNOS` | — | Constante: `{ libre, matutino, vespertino }`, cada uno un `Turno` |
| `PESO_PRIORIDAD` | — | Constante: `100` |
| `seEmpalman(seccionA, seccionB)` | dos `Seccion` | `boolean` |
| `empalmesDe(seleccion)` | `Candidata[]` | `Empalme[]` |
| `materiasEnConflicto(seleccion)` | `Candidata[]` | claves de materia, en orden alfabético |
| `minutosFueraDeTurno(seccion, turno)` | `Seccion`, `Turno` | entero |
| `minutosDeHuecos(seleccion)` | `Candidata[]` | entero |
| `costoCandidata(candidata, turno)` | `Candidata`, `Turno` | entero |
| `evaluar(seleccion, turno)` | `Candidata[]`, `Turno` | `Puntaje` |
| `crearOpcion(seleccion, turno)` | `Candidata[]`, `Turno` | `Opcion` |
| `compararOpciones(a, b)` | dos `Opcion` | negativo si `a` es mejor, positivo si `b` es mejor, `0` si son iguales |
| `cotaOptimista(asignadas, restantes, turno)` | `Candidata[]`, materias de `Problema` aún sin asignar, `Turno` | `{ conflictos, costo }` |
| `debePodar(cota, peor)` | resultado de `cotaOptimista`, la `Opcion` en tercer lugar | `boolean` |
| `construirProblema(oferta, preferencias)` | `Materia[]`, `Preferencias` | `Problema` |
| `editarOpcion(opcion, clave, nrc, problema)` | `Opcion` actual, materia y NRC nuevo, `Problema` | `Opcion` nueva, ya evaluada |

`editarOpcion` es lo que usa la edición manual: cambia la sección de una materia por otra de sus candidatas y recalcula puntaje y empalmes. Si el NRC no está entre las candidatas de esa materia, lanza un error.

Mientras el núcleo no esté en `main`, Brayan puede usar versiones provisionales con estas mismas firmas.

## Algoritmo — Brayan (`js/algoritmo/`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `buscarBacktracking(problema, k = 3)` | `Problema` | `ResultadoBusqueda` |
| `buscarExhaustiva(problema, k = 3)` | `Problema` | `ResultadoBusqueda` |
| `generarProblemaAleatorio(numMaterias, oferta, semilla)` | entero, `Materia[]`, entero | `Problema`, con turno matutino y el orden de las secciones como llegan |

- Las dos búsquedas usan las funciones del núcleo y **no** reimplementan empalmes ni puntaje.
- Las dos llenan `estadisticas` con las definiciones de `reglas-horario.md`.
- `generarProblemaAleatorio` elige materias al azar de la oferta. Con la misma semilla devuelve siempre el mismo problema, para que las mediciones se puedan repetir. Lo usan las pruebas y la página de análisis.

Pruebas en `tests/pruebas-busqueda.js`, que corren con `node tests/pruebas-busqueda.js`:

1. Los 3 escenarios de `ejemplos/` dan exactamente el resultado esperado.
2. Con al menos 200 problemas aleatorios, el backtracking y la exhaustiva dan el mismo top 3.
3. Ninguna opción de un escenario con solución sin choques tiene empalmes.

## Vista — Andrés (`js/vista/`)

### `crearFicha(seccion, datos)`

Devuelve un elemento HTML con una ficha: materia, NRC, sección, profesor, días y horas, y cupo con la hora de descarga.

- `datos`: `{ clave, nombreMateria, rango, estado }`, con `estado` igual a `"normal"`, `"fijada"`, `"descartada"` o `"conflicto"`.
- El elemento lleva `data-clave` y `data-nrc`, para que SortableJS sepa qué se movió.

### `montarListasPrioridad(contenedor, opciones)`

Dibuja una lista por materia con sus fichas, ordenables arrastrando, y una zona de descartadas.

- `opciones`: `{ materias, preferencias, descargada, alCambiar }`
  - `materias`: `Materia[]` de las materias agregadas.
  - `alCambiar(preferenciasNuevas)`: se llama cada vez que el estudiante reordena, descarta, recupera, fija o suelta una ficha. Recibe las `Preferencias` completas ya modificadas.
- Devuelve `{ actualizar(materias, preferencias, descargada) }` para redibujar cuando cambian desde fuera.
- Reglas: fijar una ficha quita la fijada anterior de esa materia; una ficha descartada no se puede fijar.

### `montarCuadricula(contenedor, opciones)`

Dibuja el horario semanal (lunes a sábado, 7:00 a 21:00) con las fichas de una opción.

- `opciones`: `{ alEditar }`
  - `alEditar(clave, nrc)`: se llama cuando el estudiante suelta en la cuadrícula una ficha de las listas de prioridad. La integración responde con `mostrar` y la opción nueva.
- Devuelve `{ mostrar(opcion, materias), limpiar() }`.
  - `mostrar` pinta cada sesión en su día y hora, y en rojo los tramos de `opcion.empalmes`.
- Las listas y la cuadrícula comparten el mismo grupo de SortableJS para poder arrastrar entre ellas. Las dos son de Andrés, así que ese detalle queda dentro de su parte.

### `montarGrafica(contenedor)`

- Devuelve `{ mostrar(mediciones) }`.
- `mediciones`: `[{ algoritmo: "backtracking" | "exhaustiva", materias, ms, nodos, combinaciones }]`.
- Dibuja tiempo contra número de materias y nodos contra número de materias, con una línea por algoritmo.

### Página de análisis (`analisis.html`, `js/analisis/`)

Andrés también arma esta página: controles de rango de materias (por ejemplo de 2 a 8) y repeticiones, un botón para medir y la gráfica. Usa `generarProblemaAleatorio`, `buscarBacktracking` y `buscarExhaustiva` con la oferta del respaldo, y basta con los mismos estilos de la página principal. La exhaustiva puede tardar mucho con muchas materias, así que se limita a un máximo configurable.

## Entrada y exportar — Daniel (`js/entrada/`, `netlify/functions/`)

### API HTTP (funciones de Netlify)

`netlify.toml` redirige `/api/*` a `/.netlify/functions/:splat`.

**`GET /api/ciclos`**

```json
{ "ciclos": [ { "id": "202710", "nombre": "Calendario 27 A" }, { "id": "202620", "nombre": "Calendario 26 B" }, { "id": "202610", "nombre": "Calendario 26 A" } ] }
```

Los 3 ciclos más recientes que lista el formulario de SIIAU, del más nuevo al más viejo. Si el más nuevo todavía no tiene materias, el estudiante simplemente cambia al siguiente.

**`GET /api/oferta?ciclo=202620&texto=algoritmos&carrera=INCO`**

- `ciclo` es obligatorio.
- `texto` es obligatorio: si parece una clave de materia (letras y números sin espacios, como `IL355`), se busca por clave; si no, por nombre.
- `carrera` es opcional.
- Responde `200` con una `RespuestaOferta` con `fuente: "siiau"` y solo las materias de CUCEI (centro `D`).
- La función junta las filas de SIIAU por NRC (cada fila es una sesión), convierte horas como `"0700-0855"` a minutos y los días a números, y recorre todas las páginas de resultados.
- Errores: `400 { "error": "Falta el parámetro ciclo" }` o similar si faltan datos, y `502 { "error": "SIIAU no respondió" }` si SIIAU falla o cambia de formato.
- Puede responder con `Cache-Control: public, max-age=3600` para no consultar SIIAU en cada búsqueda igual.

### Respaldo (`datos/`)

`datos/oferta-<ciclo>.json`, con la forma de `RespuestaOferta` y `fuente: "respaldo"`, generado con un script que corre localmente. Basta con las carreras del equipo para el ciclo actual, para que el archivo no pese demasiado.

### Funciones del navegador

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `obtenerCiclos()` | — | `Promise<Ciclo[]>`. Si la API falla, devuelve los ciclos que tienen respaldo. |
| `buscarMaterias({ ciclo, texto, carrera })` | consulta | `Promise<RespuestaOferta>`. Si la API falla, filtra el respaldo y devuelve `fuente: "respaldo"`. |
| `montarPanelEntrada(contenedor, opciones)` | contenedor y callbacks | `{ establecer({ ciclo, materias, turno }) }` |
| `copiarNRC(opcion, materias)` | `Opcion`, `Materia[]` | `Promise<string>` con el texto copiado al portapapeles |
| `exportarImagen(elemento, nombreArchivo)` | elemento HTML (la cuadrícula), texto | `Promise<void>`; descarga un `.png` |

`montarPanelEntrada` dibuja el selector de ciclo, el buscador con sus resultados, el filtro por carrera, las materias agregadas (con botón para quitar) y el selector de turno (matutino, vespertino, libre y personalizado con slider). Sus `opciones` son:

- `alCambiarCiclo(ciclo)`
- `alAgregarMateria(materia, respuesta)`: recibe la `Materia` elegida y la `RespuestaOferta` de donde salió, para conocer `descargada` y `fuente`.
- `alQuitarMateria(clave)`
- `alCambiarTurno(turno)`

`establecer` sirve para restaurar el panel al cargar un avance guardado.

`copiarNRC` copia un NRC por línea, en el orden de las materias, seguido del nombre de la materia, por ejemplo `100001  ANALISIS DE ALGORITMOS`.

## Integración — Diego (`js/app/`)

La página principal tiene estos contenedores:

| Contenedor | Módulo |
| --- | --- |
| `#panel-entrada` | `montarPanelEntrada` (Daniel) |
| `#listas-prioridad` | `montarListasPrioridad` (Andrés) |
| `#cuadricula` | `montarCuadricula` (Andrés) |
| `#opciones` | Pestañas "Opción 1, 2, 3", resumen del puntaje, aviso de materias en conflicto y botones de generar, copiar NRC y exportar imagen (Diego) |

Flujo:

1. **Agregar o quitar materia, cambiar turno o ciclo** → se actualiza el estado, se redibujan las listas y se guarda.
2. **Cambiar prioridades** (`alCambiar`) → se actualiza el estado y se guarda. No se regenera solo: se regenera con el botón **Generar**.
3. **Generar** → `construirProblema` → `buscarBacktracking` → se muestran las pestañas y la cuadrícula con la opción 1. Si hay `sinOpciones`, se avisa qué materias se quedaron sin secciones.
4. **Editar** (`alEditar`) → `editarOpcion` → `cuadricula.mostrar` con la opción nueva y el puntaje actualizado.
5. **Al cargar la página** → se lee `"horarios:v1"` de `localStorage` y se restauran el panel, las listas y la última opción.

## Demos

Cada módulo visual tiene una página en `demos/` que lo monta con los datos de `ejemplos/`, sin depender del resto. Es lo que se abre para revisar su PR.

| Demo | Muestra |
| --- | --- |
| `demos/ficha.html` | Una ficha en cada estado |
| `demos/listas.html` | Las listas del escenario 1; imprime en consola cada `alCambiar` |
| `demos/cuadricula.html` | Las opciones de los escenarios 1 y 3, con los empalmes en rojo |
| `demos/panel.html` | El panel de entrada; imprime en consola cada callback |
| `demos/grafica.html` | La gráfica con mediciones inventadas |

Para probar en tu computadora usa Live Server de VS Code: con doble clic en el HTML los módulos de JavaScript no funcionan.
