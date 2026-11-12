# planificador-horarios — contexto para Claude

Este archivo describe el proyecto para que el Claude de cada integrante trabaje con el mismo contexto. Si lo usas en claude.ai, pégalo en las instrucciones de tu proyecto y sube también los archivos de `docs/` y `ejemplos/`. Claude Code lo lee solo.

## Qué es

Aplicación web que **genera opciones de horario sin empalmes** para estudiantes de CUCEI, a partir de la oferta académica de SIIAU y de las prioridades y el turno que elige cada estudiante, y que permite ajustarlas a mano. Es el proyecto final de Análisis de Algoritmos (CUCEI, UdeG, 2026B), hecho por un equipo de 4. Los proyectos anteriores del mismo equipo fueron VisuAlgoritmos y VisualizadorHuffman; este repite su forma de trabajo, pero vive en su propio repositorio y tiene diseño propio.

Objetivo general: implementar un sistema web que genere automáticamente opciones de horario que eviten empalmes para los estudiantes de CUCEI, a partir de la oferta académica de SIIAU y de las prioridades y el turno que cada uno elija, y que permita ajustarlas manualmente, con el fin de reducir el tiempo y los errores al armar su horario.

El núcleo algorítmico es un **backtracking con poda** (ramificación y acotamiento) que obtiene las 3 mejores combinaciones. Una **búsqueda exhaustiva** con la misma entrada y salida sirve para comprobar que la poda no descarta buenas opciones y para medir la diferencia de tiempo.

## Repositorio y calendario

- Repositorio: `Equipo-aaaa/planificador-horarios`, independiente de los proyectos anteriores.
- Tablero: "Planificador" en GitHub Projects, con una issue por tarea del backlog.

El código se termina el **martes 17 de noviembre de 2026** en la noche, para la revisión de avances (17 al 20 de noviembre). Después solo quedan correcciones, la prueba con estudiantes y los documentos.

| Etapa | Fechas | Al cerrar |
| --- | --- | --- |
| Sprint 1 | jue 12 al sáb 14 nov | Página publicada; SIIAU responde desde Netlify; núcleo terminado; el backtracking da el top 3 de los escenarios; cuadrícula y listas funcionan con los datos de ejemplo |
| Sprint 2 | dom 15 al mar 17 nov | Flujo completo en la URL pública: buscar, ordenar fichas, generar, editar, copiar NRC y exportar; página de análisis con la gráfica |
| Cierre | mié 18 al vie 20 nov | Prueba con estudiantes, limpieza, README y deploy final |

Las tareas se identifican con las iniciales del responsable y un número: `DI` Diego, `DA` Daniel, `BR` Brayan, `AN` Andrés y `TO` todos (por ejemplo, `BR-02`). El número sigue el orden de las fechas, así que cada quien avanza en orden numérico. El detalle de cada tarea está en `docs/backlog.md`; al ayudar con una tarea, revisa ahí su Definition of Done y su "Depende de". Una tarea no se empieza hasta que las de su "Depende de" estén en `main`, o se trabaja con los datos de `ejemplos/` mientras tanto.

## Qué hace la app

`index.html` es la página principal:

1. **Panel de entrada:** el estudiante elige el ciclo (los 3 más recientes de SIIAU), busca materias por clave o por nombre, filtra por carrera, las agrega y elige su turno (matutino de 7:00 a 15:00, vespertino de 15:00 a 21:00, libre, o personalizado con un slider).
2. **Listas de prioridad:** una lista de fichas por materia (una ficha = un NRC), ordenable arrastrando. Cada ficha se puede descartar, recuperar o fijar.
3. **Generar:** se muestran hasta 3 opciones en pestañas, con su puntaje. Si no hay horario sin choques, se muestran las de menos materias en conflicto, con los empalmes en rojo.
4. **Cuadrícula:** el horario de lunes a sábado. Arrastrar una ficha de las listas a la cuadrícula cambia la sección de esa materia y se vuelve a evaluar.
5. **Acciones:** copiar la lista de NRC para pegarla en el registro de SIIAU y exportar la cuadrícula como imagen. El avance se guarda en el navegador.

`analisis.html` mide el backtracking contra la exhaustiva con problemas aleatorios de la oferta real y grafica tiempo y nodos contra número de materias.

## Decisiones tomadas (no cambiar sin acuerdo del equipo)

- **Stack:** HTML, CSS y JavaScript con módulos ES (`import`/`export`), **sin frameworks**. Bootstrap 5 y Bootstrap Icons por CDN. SortableJS para arrastrar (funciona en celular), html2canvas para exportar imagen y Chart.js para la gráfica, todos por CDN. `package.json` con `"type": "module"` para correr las pruebas en Node.
- **Diseño:** propio, definido por Diego en el esqueleto de la página. La paleta y la tipografía viven como variables CSS en `css/estilos.css`; cada módulo tiene su CSS en `css/modulos/` y usa esas variables.
- **Hosting:** un sitio en Netlify, conectado a este repositorio. El sitio es estático más **dos Netlify Functions** (`/api/ciclos`, `/api/oferta`), que existen porque SIIAU no tiene API ni deja que otra página lo consulte directamente (CORS). El algoritmo corre en el navegador.
- **Respaldo:** la oferta del ciclo actual se guarda como JSON en `datos/`. Si SIIAU falla o bloquea a Netlify, la app usa el respaldo y lo avisa.
- **Datos:** horas en minutos desde las 0:00, días del 0 (lunes) al 5 (sábado), NRC y claves como texto. Una sección = un NRC, con todas sus sesiones.
- **Orden de las opciones:** primero menos materias en conflicto, luego menor costo (100 × suma de rangos + minutos fuera de turno), luego menos minutos de huecos, y al final desempate por NRC. El backtracking y la exhaustiva deben dar **exactamente** el mismo top 3.
- **Cupos:** se muestran en la ficha con la hora de descarga, pero el algoritmo no los usa; el estudiante los revisa a mano.
- **Sin reseñas de profesores:** el orden lo decide solo el estudiante.

## Contratos (leer antes de programar)

Los contratos son acuerdos sobre qué datos se pasan entre partes. Son como el estándar de eventos de VisuAlgoritmos o los contratos de Huffman: si se respetan, cada quien trabaja por separado y todo encaja.

`docs/guia-del-equipo.md` explica el proyecto, el backtracking con poda y cada contrato en palabras simples. Es la puerta de entrada para las personas; los contratos tienen el detalle. Si alguien no entiende un contrato, explícaselo partiendo de la guía.

| Documento | Qué fija |
| --- | --- |
| `docs/guia-del-equipo.md` | Resumen para personas: qué se construye, cómo funciona el backtracking con poda, qué dice cada contrato y qué leer según tu parte |
| `docs/modelo-datos.md` | Forma de la oferta, las preferencias, el `Problema`, la `Opcion`, el `ResultadoBusqueda` y lo que se guarda en el navegador |
| `docs/reglas-horario.md` | Empalme, conflictos, turno, huecos, costo, cómo se comparan opciones, **desempate**, cota optimista, poda y estadísticas |
| `docs/contrato-modulos.md` | Firma de cada función exportada, API HTTP, contenedores de la página, flujo de integración y demos |
| `docs/backlog.md` | Las 37 tareas con descripción, responsable, fecha, dependencias y Definition of Done |

Datos de ejemplo verificados con una implementación de referencia: `ejemplos/oferta-ejemplo.json` (4 materias inventadas, 36 combinaciones) y tres escenarios con sus preferencias y su resultado esperado; `escenario-1-todas.json` trae las 36 combinaciones con su puntaje.

## Estructura de carpetas

```
planificador-horarios/
├── index.html                 Página principal (Diego)
├── analisis.html              Página de análisis (Andrés)
├── netlify.toml               Publica la raíz y redirige /api/* (Daniel)
├── package.json               "type": "module" (Daniel)
├── CLAUDE.md · README.md
├── css/estilos.css            Paleta, tipografía y estilos comunes (Diego)
├── css/modulos/               Un CSS por módulo
├── docs/                      Contratos y guía del equipo
├── ejemplos/                  Datos de ejemplo
├── datos/                     Respaldo de la oferta en JSON (Daniel)
├── netlify/functions/         ciclos, oferta (Daniel)
├── js/
│   ├── nucleo/                Modelo, empalmes, puntaje, cota (Diego)
│   ├── algoritmo/             Backtracking, exhaustiva, problemas aleatorios (Brayan)
│   ├── vista/                 Ficha, listas, cuadrícula, gráfica (Andrés)
│   ├── entrada/               Oferta, panel de entrada, exportar (Daniel)
│   ├── analisis/              Página de análisis (Andrés)
│   └── app/                   Integración, estado y guardado (Diego)
├── demos/                     Una página de prueba por módulo visual
└── tests/                     Pruebas del núcleo (Diego) y de la búsqueda (Brayan)
```

## Reparto

| Integrante | Parte | Carpetas |
| --- | --- | --- |
| Diego Antonio Espinosa Salinas | Contratos, núcleo (empalmes, puntaje, cota optimista), esqueleto, generar opciones, guardar avance e integración; revisa y aprueba PR | `index.html`, `css/estilos.css`, `js/nucleo/`, `js/app/`, `docs/`, pruebas del núcleo |
| Daniel Alejandro Rodríguez González | Repositorio, tablero, Netlify, funciones de SIIAU, respaldo, panel de entrada, turno, copiar NRC y exportar imagen; revisa y aprueba PR | `netlify/`, `netlify.toml`, `package.json`, `datos/`, `js/entrada/` |
| Brayan Jaziel Navarro Ayala | Búsqueda exhaustiva, backtracking con poda, problemas aleatorios, pruebas y mediciones | `js/algoritmo/`, pruebas de la búsqueda |
| José Andrés Flores Parra | Ficha, cuadrícula, listas de prioridad, edición manual, gráfica, página de análisis y diseño de la prueba con estudiantes | `js/vista/`, `js/analisis/`, `analisis.html` |

Cada quien trabaja **solo en sus carpetas**. Si necesitas algo de otra parte, usa lo que fija el contrato o los datos de `ejemplos/`. No modifiques el código de otro.

## Cómo trabajar (reglas del equipo)

- **Una issue, una rama, un PR.** La rama lleva el ID de la tarea (`BR-02-backtracking`) y el PR dice `Closes #n`, para que la issue pase sola a Terminado al aprobarse. Cada tarea nueva sale de `main` actualizado.
- `main` está protegida. Diego y Daniel revisan y aprueban los PR de todos, incluidos los propios; antes de aprobar, prueban la demo o corren las pruebas. Las ramas se borran solas al hacer merge.
- **El equipo usa GitHub Desktop.** Al explicar pasos de Git, dalos con sus botones, no con comandos:
  1. En `main`: *Fetch origin* y *Pull origin*.
  2. *Current branch → New branch* con el ID de la tarea, basada en `main`.
  3. Al terminar: *Commit*, *Publish branch* (o *Push origin*) y *Create Pull Request*.
  4. Para traer cambios de `main` a una rama abierta: *Branch → Update from main*.
- **En el tablero,** la issue pasa a *En progreso* al empezar y a *En revisión* al abrir el PR.
- **Trabajar en varias computadoras:** antes de cambiar de equipo se hace *Commit* y *Push origin*; al llegar, *Fetch origin* y *Pull origin*.
- Cada módulo visual se prueba con su página en `demos/` antes del PR. Las funciones puras se prueban en Node (`node tests/<archivo>.js`).
- **Correr localmente:** con Live Server de VS Code (los módulos ES no funcionan con doble clic, `file://`). Para probar `/api/*` se usa `netlify dev` (Netlify CLI), que sirve la página y las funciones en `localhost:8888`.
- **Código en español:** variables, funciones, comentarios y documentación. Comentarios que expliquen el *por qué*.
- **Cambiar un contrato** requiere avisar al equipo y actualizar primero el documento en `docs/`.
- Antes de entregar se borran el código muerto, las funciones provisionales y los mensajes de depuración.
- El README declara qué se hizo con IA y qué hizo el equipo, como en los proyectos anteriores.

## Cómo debe ayudar Claude

- **Explicar paso a paso** el código que propone antes de integrarlo. La regla del equipo es entender todo lo que se sube: en la revisión le pueden preguntar a cualquiera cómo funciona su parte.
- El equipo viene de Python y conoce poco JavaScript. **Comparar con Python cuando ayude**: `Map` como `dict`, `[...lista]` como `lista.copy()`, `async/await` como `asyncio`, la recursión del backtracking como la de `itertools.product` hecha a mano.
- **Respetar los contratos y lo que ya funciona.** No reescribir módulos ajenos, no cambiar firmas, formas de datos ni reglas de puntaje por iniciativa propia; si algo del contrato parece mal, señalarlo y proponer el cambio.
- **No reimplementar el núcleo.** Empalmes, puntaje, comparación y cota se importan del núcleo; nadie escribe su propia versión.
- Cualquier cambio a la poda o a la cota debe seguir pasando las pruebas contra la búsqueda exhaustiva.
- Mantener las tareas pequeñas y dentro de las carpetas del integrante.
- No agregar frameworks, herramientas de build ni dependencias de npm en el frontend sin acuerdo del equipo.
- Preguntar antes de suponer cuando una decisión no esté en este archivo o en `docs/`.
