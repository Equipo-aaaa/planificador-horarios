// DI-07 · Barra de opciones (#opciones): botón Generar, pestañas Opción 1, 2, 3,
// resumen del puntaje y avisos de choques y de materias sin secciones.
//
// Igual que los módulos de los demás, se "monta" en un contenedor y no guarda el
// estado de la app: avisa con callbacks y la integración (app.js) decide qué hacer.
// Lo único que recuerda es lo necesario para dibujarse: el último resultado y qué
// pestaña está elegida.
import { avisoChoques, avisoSinHorario, avisoSinOpciones, duracion } from './avisos.js';

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

/**
 * @param {HTMLElement} contenedor  Normalmente #opciones.
 * @param {Object} opciones
 *   - alGenerar():               se llama al presionar Generar.
 *   - alElegir(opcion, indice):  se llama al mostrar un resultado y al cambiar de
 *                                pestaña, para que la integración dibuje la opción
 *                                en la cuadrícula.
 * @returns {{ mostrar, limpiar, permitirGenerar, marcarDesactualizado, mostrarError, mostrarAviso, opcionActual }}
 */
export function montarOpciones(contenedor, { alGenerar = () => {}, alElegir = () => {} } = {}) {
  // Estructura fija. Lo que depende de los datos se llena con textContent más abajo,
  // nunca con innerHTML, para que un nombre de materia raro no rompa la página.
  contenedor.classList.add('opciones');
  contenedor.innerHTML = `
    <div class="opciones__barra">
      <div class="segmentado opciones__pestanas" role="group" aria-label="Opciones de horario" data-ref="pestanas"></div>
      <button class="boton opciones__generar" type="button" data-ref="generar" disabled>
        <i class="bi bi-arrow-repeat" aria-hidden="true"></i>Generar
      </button>
    </div>
    <div class="opciones__metricas" data-ref="metricas" hidden></div>
    <p class="opciones__vacio" data-ref="vacio">Agrega tus materias, ordénalas y presiona <b>Generar</b>.</p>
    <div class="aviso" data-ref="aviso-choques" role="status" hidden>
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span></span>
    </div>
    <div class="aviso" data-ref="aviso-sin-opciones" role="status" hidden>
      <i class="bi bi-slash-circle" aria-hidden="true"></i><span></span>
    </div>
    <p class="aviso opciones__info" data-ref="aviso-sin-horario" role="status" hidden>
      <i class="bi bi-calendar-x" aria-hidden="true"></i><span></span>
    </p>
    <p class="aviso opciones__info" data-ref="aviso-info" role="status" hidden>
      <i class="bi bi-info-circle" aria-hidden="true"></i><span></span>
    </p>
    <div class="aviso" data-ref="aviso-error" role="alert" hidden>
      <i class="bi bi-bug" aria-hidden="true"></i><span></span>
    </div>
    <p class="aviso opciones__desactualizado" data-ref="desactualizado" hidden>
      <i class="bi bi-info-circle" aria-hidden="true"></i>
      <span>Cambiaste tus materias o prioridades: presiona Generar para actualizar las opciones.</span>
    </p>
    <p class="nota opciones__estadisticas mono" data-ref="estadisticas"></p>
  `;

  const ref = (nombre) => contenedor.querySelector(`[data-ref="${nombre}"]`);
  const botonGenerar = ref('generar');

  // Último resultado mostrado: { opciones, sinOpciones, estadisticas }, el Map de
  // nombres de materia y la pestaña elegida.
  let resultado = null;
  let nombres = new Map();
  let materiasGeneradas = [];
  let indice = 0;

  botonGenerar.addEventListener('click', () => alGenerar());

  // Un solo listener para las tres pestañas: se ve en qué botón cayó el clic
  // (delegación de eventos), así no hay que volver a conectarlas al redibujar.
  ref('pestanas').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-indice]');
    if (!boton || !resultado) return;
    elegir(Number(boton.dataset.indice));
  });

  function ponerAviso(nombre, texto) {
    const aviso = ref(nombre);
    aviso.hidden = texto === null;
    aviso.querySelector('span').textContent = texto ?? '';
  }

  function crearMetrica(etiqueta, valor, clase = '') {
    const metrica = crear('div', 'opciones__metrica');
    metrica.append(crear('span', '', etiqueta), crear('b', `mono ${clase}`.trim(), valor));
    return metrica;
  }

  function dibujarPestanas() {
    const botones = resultado.opciones.map((opcion, i) => {
      const boton = crear('button');
      boton.type = 'button';
      boton.dataset.indice = i;
      boton.setAttribute('aria-pressed', String(i === indice));
      // El punto verde o rojo deja ver de un vistazo cuáles opciones tienen choques.
      const choca = opcion.puntaje.conflictos > 0;
      const punto = crear('span', `opciones__punto${choca ? ' opciones__punto--mal' : ''}`);
      punto.setAttribute('aria-hidden', 'true');
      boton.append(punto, `Opción ${i + 1}`);
      boton.title = choca ? 'Tiene choques' : 'Sin choques';
      return boton;
    });
    ref('pestanas').replaceChildren(...botones);
  }

  function dibujarOpcion() {
    const opcion = resultado.opciones[indice];
    const p = opcion.puntaje;
    ref('metricas').hidden = false;
    ref('metricas').replaceChildren(
      crearMetrica('Choques', String(p.conflictos), p.conflictos > 0 ? 'mal' : 'bien'),
      crearMetrica('Costo', String(p.costo)),
      crearMetrica('Fuera de turno', duracion(p.minutosFuera)),
      crearMetrica('Huecos', duracion(p.huecos)),
    );
    ponerAviso('aviso-choques', avisoChoques(resultado.opciones, indice, nombres));
    ponerAviso('aviso-sin-horario', avisoSinHorario(opcion, materiasGeneradas));
    for (const boton of ref('pestanas').children) {
      boton.setAttribute('aria-pressed', String(Number(boton.dataset.indice) === indice));
    }
    alElegir(opcion, indice);
  }

  function elegir(nuevo) {
    if (nuevo === indice) return;
    indice = nuevo;
    dibujarOpcion();
  }

  /**
   * Muestra un ResultadoBusqueda.
   * @param {Object} nuevo     ResultadoBusqueda del backtracking.
   * @param {Object[]} materias Materia[] con que se generó, para los nombres.
   * @param {number} [inicial] Pestaña a mostrar (la restaura el guardado, DI-08).
   */
  function mostrar(nuevo, materias, inicial = 0) {
    resultado = nuevo;
    ponerAviso('aviso-error', null);
    ponerAviso('aviso-info', null);
    materiasGeneradas = materias;
    nombres = new Map(materias.map((m) => [m.clave, m.nombre]));
    indice = Math.min(Math.max(inicial, 0), Math.max(nuevo.opciones.length - 1, 0));
    marcarDesactualizado(false);

    const { nodos, combinaciones, ms } = nuevo.estadisticas;
    ref('estadisticas').textContent =
      `Backtracking: ${nodos} nodos visitados · ${combinaciones} horarios completos evaluados · ${ms.toFixed(1)} ms`;
    ponerAviso('aviso-sin-opciones', avisoSinOpciones(nuevo.sinOpciones, nombres));

    if (nuevo.opciones.length === 0) {
      // Pasa si todas las materias se quedaron sin secciones: no hay nada que dibujar.
      ref('pestanas').replaceChildren();
      ref('metricas').hidden = true;
      ref('vacio').hidden = true;
      ponerAviso('aviso-choques', null);
      ponerAviso('aviso-sin-horario', null);
      alElegir(null, -1);
      return;
    }
    ref('vacio').hidden = true;
    dibujarPestanas();
    dibujarOpcion();
  }

  // Vuelve al estado inicial (por ejemplo, al quitar todas las materias).
  function limpiar() {
    resultado = null;
    indice = 0;
    ref('pestanas').replaceChildren();
    ref('metricas').hidden = true;
    ref('vacio').hidden = false;
    ref('estadisticas').textContent = '';
    ponerAviso('aviso-choques', null);
    ponerAviso('aviso-sin-opciones', null);
    ponerAviso('aviso-sin-horario', null);
    ponerAviso('aviso-error', null);
    marcarDesactualizado(false);
  }

  // Si algo falla (la búsqueda, las listas…), se dice en la página en lugar de solo
  // en consola, para que se vea qué pasó. Se conserva lo que ya estaba a la vista.
  function mostrarError(texto) {
    ponerAviso('aviso-error', texto);
  }

  // Generar solo tiene sentido con al menos una materia agregada.
  function permitirGenerar(permitido) {
    botonGenerar.disabled = !permitido;
  }

  // El contrato pide no regenerar solo al cambiar prioridades. Mientras tanto, las
  // opciones a la vista ya no corresponden a lo que eligió el estudiante: se avisa.
  function marcarDesactualizado(desactualizado) {
    ref('desactualizado').hidden = !desactualizado || resultado === null;
  }

  // Mensaje informativo de la integración (por ejemplo, al cambiar de ciclo).
  // Con null se oculta.
  function mostrarAviso(texto) {
    ponerAviso('aviso-info', texto);
  }

  // La opción a la vista, o null. La usarán copiar NRC y el guardado.
  function opcionActual() {
    return resultado?.opciones[indice] ?? null;
  }

  return { mostrar, limpiar, permitirGenerar, marcarDesactualizado, mostrarError, mostrarAviso, opcionActual };
}
