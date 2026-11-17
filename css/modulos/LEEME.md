# css/modulos

Un archivo CSS por módulo, para que nadie edite el mismo archivo que otro:

| Archivo | Módulo | Integrante |
| --- | --- | --- |
| `panel-entrada.css` | Panel de entrada y turno | Daniel |
| `ficha.css` | Ficha de sección | Andrés |
| `listas.css` | Listas de prioridad | Andrés |
| `cuadricula.css` | Cuadrícula del horario | Andrés |
| `opciones.css` | Pestañas, puntaje y acciones | Diego |

Reglas:

- Usa las variables de `css/estilos.css` (`--texto`, `--linea`, `--acento`, `--conflicto`, `--materia-1` a `--materia-8`…), nunca colores escritos a mano. Así tu módulo funciona en el tema claro y en el oscuro sin hacer nada más.
- Antes de crear un estilo, revisa los componentes comunes de `estilos.css`: `.titulo-seccion`, `.paso`, `.segmentado`, `.boton`, `.enlace`, `.letra`, `.aviso`, `.nota` y `.mono`.
- Empieza tus selectores con el contenedor o con un prefijo de tu módulo (`#cuadricula .bloque`, `.ficha-…`), para no pisar estilos de otros.
- Tu demo en `demos/` carga `css/estilos.css` y tu archivo; en `index.html` la hoja se agrega al integrar.
- La maqueta aprobada está en `docs/propuesta-diseno.html` (ábrela con Live Server): ahí se ven la ficha, la cuadrícula, los choques, la línea de hora y el resaltado por NRC que se esperan. Es solo referencia; sus clases no tienen que coincidir con las tuyas.
