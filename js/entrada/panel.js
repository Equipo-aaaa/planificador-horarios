// DA-08 · Panel de entrada
//
// Dibuja dentro de un contenedor los pasos del buscador:
//   01 Ciclo · 02 Buscar materias · 03 Agregadas
// (el 04 Turno se agrega en DA-09).
//
// Como pide el contrato, el panel NO guarda el estado de la app: solo avisa
// con callbacks lo que hizo el estudiante, y la integración (Diego) decide qué
// hacer. Lo único que recuerda es lo que necesita para dibujarse: la lista de
// agregadas y los últimos resultados.

import { obtenerCiclos, buscarMaterias } from "./oferta.js";
import { textoDescarga } from "../vista/formato.js";

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
  } = opciones;

  // ----- Lo que el panel recuerda para dibujarse -----
  let agregadas = [];          // Materia[] en el orden en que se agregaron
  let respuestaActual = null;  // RespuestaOferta de la última búsqueda
  let cicloRestaurado = null;  // ciclo que pidió establecer() antes de que llegaran los ciclos
  let numeroBusqueda = 0;      // para ignorar respuestas viejas (ver buscar())

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

  dibujarAgregadas();

  // ----- Lo que el panel ofrece hacia fuera -----

  return {
    // Restaura el panel al cargar un avance guardado. No llama callbacks:
    // la página ya conoce ese estado, solo lo estamos pintando.
    // El turno lo usará DA-09.
    establecer({ ciclo, materias = [] } = {}) {
      if (ciclo) {
        cicloRestaurado = ciclo;
        if (!ref("ciclo").disabled) ponerCiclo(ciclo);
      }
      agregadas = [...materias];
      dibujarAgregadas();
      dibujarResultados();
    },
  };
}
