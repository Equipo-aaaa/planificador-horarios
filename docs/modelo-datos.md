# Contrato: modelo de datos

Este documento fija **cómo se representa cada dato** del proyecto: la oferta que llega de SIIAU, las preferencias del estudiante, el problema que recibe el algoritmo y las opciones de horario que devuelve. Todos los módulos leen y escriben estas formas exactas. Si algo no te cuadra, coméntalo antes de programar; **no se cambia sin avisar**.

Los ejemplos de este documento salen de `ejemplos/oferta-ejemplo.json` y `ejemplos/escenario-1-*.json`. Las materias, profesores y NRC del ejemplo son **inventados**.

## Convenciones

| Dato | Representación | Ejemplo |
| --- | --- | --- |
| Hora | Entero: **minutos desde las 0:00** | 7:00 → `420`, 8:55 → `535`, 15:00 → `900` |
| Día | Entero de `0` a `5` | `0` lunes, `1` martes, `2` miércoles, `3` jueves, `4` viernes, `5` sábado |
| NRC y clave | Siempre **texto**, aunque parezcan números | `"100001"`, `"IL355"` |
| Ciclo | Texto con el código de SIIAU | `"202620"` = Calendario 26 B, `"202710"` = 27 A |
| Rango de una hora | `inicio` incluido, `fin` excluido | `inicio: 420, fin: 535` es de 7:00 a 8:55 |

Las horas son números para poder compararlas con `<` y restarlas sin convertir textos. Solo se convierten a `"07:00"` para mostrarlas.

## Oferta

### `Sesion`

Un bloque de clase en un día. Una fila de SIIAU con varios días (por ejemplo lunes y miércoles) se convierte en **una sesión por día**.

```json
{ "dia": 0, "inicio": 420, "fin": 535, "edificio": "DUCT1", "aula": "A001" }
```

### `Seccion`

Un NRC. Es la unidad que se elige y lo que se dibuja como una ficha. Si un NRC tiene sesiones en horarios distintos (teoría y laboratorio, por ejemplo), sigue siendo **una sola sección** con todas sus sesiones.

```json
{
  "nrc": "100012",
  "seccion": "D02",
  "profesor": "CASTRO VEGA, PEDRO",
  "cupo": 35,
  "disponibles": 9,
  "sesiones": [
    { "dia": 1, "inicio": 540, "fin": 655, "edificio": "DUCT1", "aula": "A003" },
    { "dia": 3, "inicio": 780, "fin": 895, "edificio": "DUCT1", "aula": "LC03" }
  ]
}
```

- `profesor` puede ser `""` si SIIAU no lo trae. Si las sesiones tienen profesores distintos, se usa el de la primera.
- `cupo` y `disponibles` son informativos. El algoritmo **no** los usa: el estudiante revisa los cupos a mano. La ficha los muestra junto con la hora de descarga.

### `Materia`

```json
{ "clave": "IL356", "nombre": "BASES DE DATOS", "creditos": 8, "secciones": [ /* Seccion */ ] }
```

### `RespuestaOferta`

Lo que devuelve la búsqueda de materias, venga de SIIAU o del respaldo.

```json
{
  "ciclo": "202620",
  "descargada": "2026-11-12T08:00:00.000Z",
  "fuente": "siiau",
  "materias": [ /* Materia */ ]
}
```

- `fuente` es `"siiau"` si se consultó en vivo y `"respaldo"` si se leyó el JSON guardado en el repo. La página muestra un aviso cuando es `"respaldo"`.
- `descargada` es una fecha ISO. En el respaldo es la fecha en que se generó el archivo.

### `Ciclo`

```json
{ "id": "202620", "nombre": "Calendario 26 B" }
```

## Preferencias del estudiante

### `Turno`

```json
{ "tipo": "matutino", "inicio": 420, "fin": 900 }
```

| `tipo` | `inicio` | `fin` | Nota |
| --- | --- | --- | --- |
| `"libre"` | `0` | `1440` | Nada queda fuera de turno |
| `"matutino"` | `420` | `900` | De 7:00 a 15:00 |
| `"vespertino"` | `900` | `1260` | De 15:00 a 21:00 |
| `"personalizado"` | lo que diga el slider | lo que diga el slider | En pasos de 30 min |

Los tres primeros son fijos y están en la constante `TURNOS` del núcleo.

### `PreferenciaMateria`

Lo que el estudiante decidió sobre **una** materia.

```json
{ "clave": "IL355", "orden": ["100001", "100002", "100003"], "descartadas": [], "fijada": null }
```

- `orden`: los NRC que sí acepta, del favorito al menos deseado. Su posición es el **rango**: el primero tiene rango `0`.
- `descartadas`: los NRC que quitó ("no la quiero" o "ya no tiene cupo"). **No** aparecen en `orden`.
- `fijada`: un NRC de `orden` que debe usarse sí o sí, o `null`.
- Al agregar una materia, `orden` empieza con todas sus secciones en el orden en que llegan, `descartadas` vacío y `fijada` en `null`.

### `Preferencias`

```json
{
  "ciclo": "202620",
  "turno": { "tipo": "matutino", "inicio": 420, "fin": 900 },
  "materias": [ /* PreferenciaMateria, en el orden en que se agregaron */ ]
}
```

## Entrada del algoritmo

### `Problema`

Las preferencias ya cruzadas con la oferta. Lo arma `construirProblema(oferta, preferencias)` del núcleo, para que el algoritmo no tenga que buscar nada en la oferta.

```json
{
  "turno": { "tipo": "matutino", "inicio": 420, "fin": 900 },
  "materias": [
    {
      "clave": "IL355",
      "nombre": "ANALISIS DE ALGORITMOS",
      "candidatas": [
        { "clave": "IL355", "nrc": "100001", "rango": 0, "seccion": { /* Seccion */ } },
        { "clave": "IL355", "nrc": "100002", "rango": 1, "seccion": { /* Seccion */ } }
      ]
    }
  ],
  "sinOpciones": []
}
```

Reglas de construcción:

1. Las `candidatas` de cada materia son las secciones de `orden`, en ese orden, con su `rango`.
2. Si la materia tiene `fijada`, su única candidata es esa sección, **con el rango que tenía en `orden`**.
3. Si una materia se queda sin candidatas (descartó todas), no entra en `materias` y su clave va a `sinOpciones`.

A una candidata (`{ clave, nrc, rango, seccion }`) le llamamos **`Candidata`** en el resto de los documentos.

## Salida del algoritmo

### `Puntaje`

```json
{ "conflictos": 0, "prioridad": 1, "minutosFuera": 0, "costo": 100, "huecos": 260 }
```

Cómo se calcula cada campo está en `reglas-horario.md`. **Menor es mejor** en todos.

### `Empalme`

Un choque entre dos secciones en un día concreto. Si dos secciones chocan lunes y miércoles, son dos empalmes.

```json
{ "claveA": "IL355", "nrcA": "100001", "claveB": "IL356", "nrcB": "100011", "dia": 0, "inicio": 420, "fin": 535 }
```

`inicio` y `fin` son el tramo exacto que se traslapa, para pintarlo en rojo en la cuadrícula.

### `Opcion`

Un horario completo: una sección por materia.

```json
{
  "secciones": [
    { "clave": "IL355", "nrc": "100001", "rango": 0 },
    { "clave": "IL356", "nrc": "100012", "rango": 1 },
    { "clave": "IL357", "nrc": "100021", "rango": 0 },
    { "clave": "MT201", "nrc": "100032", "rango": 0 }
  ],
  "puntaje": { "conflictos": 0, "prioridad": 1, "minutosFuera": 0, "costo": 100, "huecos": 260 },
  "empalmes": []
}
```

- `secciones` va en el mismo orden que `problema.materias`.
- Para dibujar, la vista busca la `Seccion` completa en la oferta con la clave y el NRC.

### `ResultadoBusqueda`

Lo que devuelven las dos búsquedas, con la misma forma.

```json
{
  "opciones": [ /* hasta 3 Opcion, de la mejor a la peor */ ],
  "sinOpciones": [],
  "estadisticas": { "nodos": 29, "combinaciones": 7, "ms": 0.4 }
}
```

- `opciones` tiene menos de 3 elementos solo si no existen 3 combinaciones distintas.
- `estadisticas` se define en `reglas-horario.md`, sección "Estadísticas".

## Estado guardado en el navegador

La página guarda el avance en `localStorage` con la llave `"horarios:v1"`, para no perderlo al recargar:

```json
{
  "version": 1,
  "materias": [ /* Materia: la oferta de las materias agregadas */ ],
  "descargada": "2026-11-12T08:00:00.000Z",
  "preferencias": { /* Preferencias */ },
  "opcionActual": { /* Opcion, o null */ }
}
```

Se guarda la oferta de las materias agregadas para que la página funcione al recargar aunque SIIAU no responda. Si al leerlo `version` no es `1` o el JSON está dañado, se ignora y se empieza de cero.
