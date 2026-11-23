// DA-08 · Panel de entrada
//
// Dibuja dentro de un contenedor los pasos del buscador:
//   01 Ciclo · 02 Buscar materias · 03 Agregadas · 04 Turno
//
// Como pide el contrato, el panel NO guarda el estado de la app: solo avisa
// con callbacks lo que hizo el estudiante, y la integración (Diego) decide qué
// hacer. Lo único que recuerda es lo que necesita para dibujarse: la lista de
// agregadas y los últimos resultados.

import { obtenerCiclos, buscarMaterias } from "./oferta.js";
import { textoDescarga } from "../vista/formato.js";
import { TURNOS } from "../nucleo/index.js";

// Carreras del filtro. "" = sin filtro. Para agregar otra basta una línea más.
const CARRERAS = [
  ["", "Todas las carreras"],
  ["ICOM", "ICOM · Ing. en Computación"],
  ["INCO", "INCO · Ing. en Comunicaciones y Electrónica"],
  ["INNI", "INNI · Ing. en Informática"],
];

// Mismos 8 colores que usa la cuadrícula (--materia-1 a --materia-8), en el
// orden en que se agregan las materias.
const NUM_COLORES = 8;

// Botones del turno, en el orden en que se ven. "personalizado" no está en
// TURNOS del núcleo porque su rango lo decide el slider.
const BOTONES_TURNO = [
  ["matutino", "Mañana"],
  ["vespertino", "Tarde"],
  ["libre", "Libre"],
  ["personalizado", "Otro"],
];

// Límites del slider: los mismos de la cuadrícula (7:00 a 21:00), en minutos,
// en pasos de 30 minutos como pide DA-09.
const SLIDER_MIN = 420;
const SLIDER_MAX = 1260;
const SLIDER_PASO = 30;

// Con una sola letra SIIAU devuelve cientos de materias y tarda mucho.
const MIN_LETRAS = 2;

export function montarPanelEntrada(contenedor, opciones = {}) {
  // Si quien monta el panel no pasa algún callback, usamos uno que no hace
  // nada, para no tener que revisar "if (alAgregarMateria)" en cada lugar.
  const nada = () => {};
  const {
    alCambiarCiclo = nada,
    alAgregarMateria = nada,
    alQuitarMateria = nada,
    alCambiarTurno = nada,
  } = opciones;

  // ----- Lo que el panel recuerda para dibujarse -----
  let agregadas = [];          // Materia[] en el orden en que se agregaron
  let respuestaActual = null;  // RespuestaOferta de la última búsqueda
  let cicloRestaurado = null;  // ciclo que pidió establecer() antes de que llegaran los ciclos
  let numeroBusqueda = 0;      // para ignorar respuestas viejas (ver buscar())
  let turno = { ...TURNOS.matutino }; // el mismo que trae por defecto modelo-datos.md

  contenedor.innerHTML = `
    <div class="panel-entrada">
      <section class="paso">
        <h2 class="titulo-seccion"><span class="num">01</span>Ciclo</h2>
        <select class="form-select" data-ref="ciclo" aria-label="Ciclo escolar" disabled>
          <option>Cargando ciclos…</option>
        </select>
      </section>

      <section class="paso">
        <h2 class="titulo-seccion"><span class="num">02</span>Buscar materias</h2>
        <form data-ref="formulario" role="search">
          <div class="panel-entrada__buscador">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input class="form-control" data-ref="texto" type="search" enterkeyhint="search"
                   placeholder="IL355 o algoritmos" aria-label="Clave o nombre de la materia" autocomplete="off">
          </div>
          <select class="form-select mt-2" data-ref="carrera" aria-label="Filtrar por carrera">
            ${CARRERAS.map(([clave, nombre]) => `<option value="${clave}">${nombre}</option>`).join("")}
          </select>
        </form>
        <p class="nota" data-ref="estado">Por clave o por nombre, y Enter. Solo materias de CUCEI.</p>
        <div class="aviso panel-entrada__respaldo mt-2" data-ref="aviso" hidden></div>
        <ul class="panel-entrada__lista" data-ref="resultados"></ul>
      </section>

      <section class="paso">
        <h2 class="titulo-seccion">
          <span class="num">03</span>Agregadas<span class="cuenta" data-ref="cuenta">0</span>
        </h2>
        <ul class="panel-entrada__lista" data-ref="agregadas"></ul>
        <p class="nota" data-ref="sin-agregadas">Todavía no agregas materias.</p>
      </section>

      <section class="paso">
        <h2 class="titulo-seccion"><span class="num">04</span>Turno</h2>
        <div class="segmentado panel-entrada__turnos" data-ref="turnos" role="group" aria-label="Turno">
          ${BOTONES_TURNO.map(([tipo, texto]) =>
            `<button type="button" data-tipo="${tipo}" aria-pressed="false">${texto}</button>`).join("")}
        </div>
        <div class="panel-entrada__riel" data-ref="riel">
          <div class="panel-entrada__tramo" data-ref="tramo"></div>
          <input type="range" data-ref="desde" min="${SLIDER_MIN}" max="${SLIDER_MAX}" step="${SLIDER_PASO}"
                 aria-label="Hora de inicio del turno">
          <input type="range" data-ref="hasta" min="${SLIDER_MIN}" max="${SLIDER_MAX}" step="${SLIDER_PASO}"
                 aria-label="Hora de fin del turno">
        </div>
        <div class="panel-entrada__marcas mono">
          <span>7:00</span><span class="panel-entrada__rango" data-ref="rango"></span><span>21:00</span>
        </div>
        <p class="nota">Una clase fuera de turno no se descarta: cuenta en contra.</p>
      </section>
    </div>
  `;

  // Atajo para encontrar las partes del panel: ref("texto") = el <input>.
  // Se busca solo dentro del contenedor, para no chocar con otros módulos.
  const ref = (nombre) => contenedor.querySelector(`[data-ref="${nombre}"]`);

  // ----- 01 · Ciclo -----

  cargarCiclos();

  async function cargarCiclos() {
    const ciclos = await obtenerCiclos();
    const selector = ref("ciclo");
    selector.replaceChildren(...ciclos.map((ciclo) => new Option(ciclo.nombre, ciclo.id)));
    selector.disabled = false;

    if (cicloRestaurado) {
      // Se restauró un avance mientras cargaban: respetamos ese ciclo.
      ponerCiclo(cicloRestaurado);
    } else {
      // Avisamos el ciclo con el que arranca, para que la página sepa en cuál
      // buscar aunque el estudiante nunca toque el selector.
      alCambiarCiclo(selector.value);
    }
  }

  ref("ciclo").addEventListener("change", (evento) => {
    // Los resultados eran del ciclo anterior: se borran para no confundir.
    respuestaActual = null;
    dibujarResultados();
    ref("aviso").hidden = true;
    alCambiarCiclo(evento.target.value);
  });

  // Si el ciclo guardado ya no aparece en SIIAU, lo agregamos al final para no
  // perder el avance del estudiante.
  function ponerCiclo(id) {
    const selector = ref("ciclo");
    if (![...selector.options].some((opcion) => opcion.value === id)) {
      selector.add(new Option(`Ciclo ${id}`, id));
    }
    selector.value = id;
  }

  // ----- 02 · Buscar -----

  // Se busca al dar Enter (submit) y no con cada letra: cada búsqueda consulta
  // SIIAU y tarda unos segundos.
  ref("formulario").addEventListener("submit", (evento) => {
    evento.preventDefault(); // que el formulario no recargue la página
    buscar();
  });

  // Cambiar la carrera con un texto ya escrito vuelve a buscar.
  ref("carrera").addEventListener("change", () => {
    if (ref("texto").value.trim().length >= MIN_LETRAS) buscar();
  });

  async function buscar() {
    const texto = ref("texto").value.trim();
    if (texto.length < MIN_LETRAS) {
      ponerEstado(`Escribe al menos ${MIN_LETRAS} letras.`);
      return;
    }

    // Si el estudiante busca "alg" y luego "bases" antes de que responda la
    // primera, la primera puede llegar al final y pisar a la segunda. Cada
    // búsqueda lleva un número y solo se dibuja la más reciente.
    const miNumero = ++numeroBusqueda;
    ponerEstado("Buscando…");

    try {
      const respuesta = await buscarMaterias({
        ciclo: ref("ciclo").value,
        texto,
        carrera: ref("carrera").value,
      });
      if (miNumero !== numeroBusqueda) return; // llegó otra más nueva

      respuestaActual = respuesta;
      const cuantas = respuesta.materias.length;
      ponerEstado(cuantas === 0 ? "Sin resultados." : `${cuantas} ${cuantas === 1 ? "materia" : "materias"}.`);
      mostrarAvisoRespaldo(respuesta);
      dibujarResultados();
    } catch (error) {
      if (miNumero !== numeroBusqueda) return;
      // Falló SIIAU y además no hay respaldo de este ciclo.
      respuestaActual = null;
      dibujarResultados();
      ponerEstado("No se pudo buscar: SIIAU no respondió y este ciclo no tiene respaldo.");
      console.error(error);
    }
  }

  function ponerEstado(texto) {
    ref("estado").textContent = texto;
  }

  function mostrarAvisoRespaldo(respuesta) {
    const aviso = ref("aviso");
    aviso.hidden = respuesta.fuente !== "respaldo";
    if (aviso.hidden) return;

    // El respaldo no sabe de qué carrera es cada materia (ver oferta.js).
    const sinFiltro = ref("carrera").value ? " El filtro de carrera no aplica." : "";
    aviso.innerHTML = `<i class="bi bi-cloud-slash" aria-hidden="true"></i>`;
    aviso.append(`SIIAU no respondió: se usa la oferta guardada (${textoDescarga(respuesta.descargada)}).${sinFiltro}`);
  }

  function dibujarResultados() {
    const materias = respuestaActual?.materias ?? [];
    ref("resultados").replaceChildren(...materias.map((materia) => {
      const yaAgregada = agregadas.some((otra) => otra.clave === materia.clave);
      const boton = crearBoton(
        yaAgregada ? "bi-check2" : "bi-plus-lg",
        yaAgregada ? `${materia.nombre} ya está agregada` : `Agregar ${materia.nombre}`,
        () => agregar(materia),
      );
      boton.disabled = yaAgregada;
      return crearRenglon(materia, null, boton);
    }));
  }

  // ----- 03 · Agregadas -----

  function agregar(materia) {
    // Guardamos la respuesta de la que salió ANTES de que otra búsqueda la
    // cambie: el contrato pide pasarla para conocer "descargada" y "fuente".
    const respuesta = respuestaActual;
    agregadas = [...agregadas, materia];
    dibujarAgregadas();
    dibujarResultados(); // para que su botón cambie a "ya agregada"
    alAgregarMateria(materia, respuesta);
  }

  function quitar(clave) {
    agregadas = agregadas.filter((materia) => materia.clave !== clave);
    dibujarAgregadas();
    dibujarResultados(); // por si estaba en los resultados, se puede volver a agregar
    alQuitarMateria(clave);
  }

  function dibujarAgregadas() {
    ref("cuenta").textContent = agregadas.length;
    ref("sin-agregadas").hidden = agregadas.length > 0;
    ref("agregadas").replaceChildren(...agregadas.map((materia, indice) => {
      const boton = crearBoton("bi-x-lg", `Quitar ${materia.nombre}`, () => quitar(materia.clave));
      boton.classList.add("panel-entrada__quitar");
      return crearRenglon(materia, indice, boton);
    }));
  }

  // ----- Piezas para dibujar -----

  // Un renglón: [letra de color] Nombre / clave · N secciones [botón].
  // Los textos de SIIAU se ponen con textContent y no dentro de innerHTML,
  // para que un nombre con "<" no se interprete como HTML.
  function crearRenglon(materia, indiceColor, boton) {
    const renglon = document.createElement("li");

    if (indiceColor !== null) {
      const letra = document.createElement("span");
      letra.className = "letra";
      letra.style.setProperty("--color", `var(--materia-${(indiceColor % NUM_COLORES) + 1})`);
      letra.textContent = materia.nombre.charAt(0);
      renglon.append(letra);
    }

    const nombre = document.createElement("span");
    nombre.className = "panel-entrada__nombre";
    const detalle = document.createElement("small");
    detalle.className = "mono";
    const secciones = materia.secciones.length;
    detalle.textContent = `${materia.clave} · ${secciones} ${secciones === 1 ? "sección" : "secciones"}`;
    nombre.append(materia.nombre, detalle);

    renglon.append(nombre, boton);
    return renglon;
  }

  function crearBoton(icono, etiqueta, alHacerClic) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-icono panel-entrada__boton";
    boton.title = etiqueta;
    boton.setAttribute("aria-label", etiqueta);
    boton.innerHTML = `<i class="bi ${icono}" aria-hidden="true"></i>`;
    boton.addEventListener("click", alHacerClic);
    return boton;
  }

  // ----- 04 · Turno -----

  // Botones: los fijos usan el rango de TURNOS; "Otro" toma lo que marque el
  // slider en ese momento.
  ref("turnos").addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-tipo]");
    if (!boton) return;
    const tipo = boton.dataset.tipo;
    // Volver a picar el mismo botón no cambia nada: no avisamos otra vez.
    if (tipo === turno.tipo) return;
    const nuevo = tipo === "personalizado"
      ? { tipo, inicio: Number(ref("desde").value), fin: Number(ref("hasta").value) }
      : { ...TURNOS[tipo] }; // copia: TURNOS está congelado (Object.freeze)
    cambiarTurno(nuevo);
  });

  // Slider: son dos <input type="range"> encimados, uno para cada extremo.
  // "input" se dispara mientras se arrastra: solo redibujamos.
  // "change" se dispara al soltar: ahí sí avisamos, para no mandar un aviso
  // por cada paso de 30 minutos.
  for (const nombre of ["desde", "hasta"]) {
    ref(nombre).addEventListener("input", () => {
      separarTopes(nombre);
      dibujarTurno({ tipo: "personalizado", inicio: Number(ref("desde").value), fin: Number(ref("hasta").value) });
    });
    ref(nombre).addEventListener("change", () => {
      cambiarTurno({ tipo: "personalizado", inicio: Number(ref("desde").value), fin: Number(ref("hasta").value) });
    });
  }

  // Los topes no se pueden cruzar: el turno dura al menos un paso (30 min).
  // Se mueve el que NO está arrastrando el estudiante.
  function separarTopes(arrastrado) {
    const desde = ref("desde");
    const hasta = ref("hasta");
    if (Number(hasta.value) - Number(desde.value) >= SLIDER_PASO) return;
    if (arrastrado === "desde") {
      desde.value = Math.min(Number(desde.value), SLIDER_MAX - SLIDER_PASO);
      hasta.value = Number(desde.value) + SLIDER_PASO;
    } else {
      hasta.value = Math.max(Number(hasta.value), SLIDER_MIN + SLIDER_PASO);
      desde.value = Number(hasta.value) - SLIDER_PASO;
    }
  }

  function cambiarTurno(nuevo) {
    turno = nuevo;
    dibujarTurno(turno);
    alCambiarTurno({ ...turno });
  }

  // Pinta botones, slider y texto para un turno. El libre (0 a 1440) se sale
  // del slider, así que lo mostramos de punta a punta.
  function dibujarTurno({ tipo, inicio, fin }) {
    for (const boton of ref("turnos").querySelectorAll("button")) {
      boton.setAttribute("aria-pressed", String(boton.dataset.tipo === tipo));
    }

    const desde = Math.max(inicio, SLIDER_MIN);
    const hasta = Math.min(fin, SLIDER_MAX);
    ref("desde").value = desde;
    ref("hasta").value = hasta;

    // El tramo de color va de un tope al otro, en porcentaje del riel.
    const porcentaje = (minutos) => ((minutos - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
    ref("tramo").style.left = `${porcentaje(desde)}%`;
    ref("tramo").style.width = `${porcentaje(hasta) - porcentaje(desde)}%`;

    ref("rango").textContent = tipo === "libre" ? "Todo el día" : `${hora(inicio)} – ${hora(fin)}`;
  }

  // 450 → "7:30". Sin cero a la izquierda, como las marcas 7:00 y 21:00.
  function hora(minutos) {
    return `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, "0")}`;
  }

  dibujarAgregadas();
  dibujarTurno(turno);

  // ----- Lo que el panel ofrece hacia fuera -----

  return {
    // Restaura el panel al cargar un avance guardado. No llama callbacks:
    // la página ya conoce ese estado, solo lo estamos pintando.
    establecer({ ciclo, materias = [], turno: turnoGuardado } = {}) {
      if (ciclo) {
        cicloRestaurado = ciclo;
        if (!ref("ciclo").disabled) ponerCiclo(ciclo);
      }
      agregadas = [...materias];
      dibujarAgregadas();
      dibujarResultados();
      if (turnoGuardado) {
        turno = { ...turnoGuardado };
        dibujarTurno(turno);
      }
    },
  };
}
