import { crearFicha } from "./ficha.js";
import { descartar, recuperar, alternarFijada } from "./cambios.js";

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

const ACCIONES = { fijar: alternarFijada, descartar, recuperar };

const FOCO_SIGUIENTE = { fijar: "fijar", descartar: "recuperar", recuperar: "fijar" };

/**
 * Dibuja una lista por materia con sus fichas, que se reordenan arrastrando y se
 * pueden fijar o descartar, y una zona de descartadas desde donde se recuperan.
 *
 * @param {HTMLElement} contenedor  Elemento donde se dibuja; no se toca nada fuera de él.
 * @param {Object} opciones
 *   - materias:     Materia[] de las materias agregadas
 *   - preferencias: Preferencias (contrato) con el orden de cada materia
 *   - descargada:   fecha ISO de la oferta, para el cupo de cada ficha
 *   - alCambiar(preferenciasNuevas): se llama cada vez que el estudiante reordena,
 *                   descarta, recupera o fija; recibe las Preferencias COMPLETAS ya modificadas
 * @returns {{ actualizar(materias, preferencias, descargada): void }}
 */
export function montarListasPrioridad(contenedor, opciones) {
  const { alCambiar } = opciones;

  if (typeof Sortable === "undefined") {
    throw new Error("Falta cargar SortableJS antes de montar las listas de prioridad");
  }

  contenedor.classList.add("listas");

  let actual = {
    materias: opciones.materias,
    preferencias: opciones.preferencias,
    descargada: opciones.descargada,
  };
  let ordenables = [];

  function crearBoton(accion, icono, texto, clave, nrc, { visible = false, presionado } = {}) {
    const boton = crear("button", "lista__boton");
    boton.type = "button";
    boton.dataset.accion = accion;
    boton.dataset.clave = clave;
    boton.dataset.nrc = nrc;
    boton.title = texto;
    boton.setAttribute("aria-label", `${texto}: NRC ${nrc}`);
    if (presionado !== undefined) boton.setAttribute("aria-pressed", String(presionado));
    boton.append(crear("i", `bi ${icono}`));
    if (visible) boton.append(crear("span", "lista__boton-texto", texto));
    return boton;
  }

  function crearItem(seccion, materia, preferencia) {
    const item = crear("div", "lista__item");
    item.dataset.nrc = seccion.nrc;

    const asa = crear("span", "lista__asa");
    asa.setAttribute("role", "img");
    asa.setAttribute("aria-label", "Arrastrar para reordenar");
    asa.title = "Arrastrar para reordenar";
    asa.append(crear("i", "bi bi-grip-vertical"));

    const fijada = preferencia.fijada === seccion.nrc;
    const ficha = crearFicha(seccion, {
      clave: materia.clave,
      nombreMateria: materia.nombre,
      estado: fijada ? "fijada" : "normal",
      descargada: actual.descargada,
    });

    const acciones = crear("div", "lista__acciones");
    acciones.append(
      crearBoton(
        "fijar",
        fijada ? "bi-pin-angle-fill" : "bi-pin-angle",
        fijada ? "Quitar fijación" : "Fijar",
        materia.clave,
        seccion.nrc,
        { presionado: fijada },
      ),
      crearBoton("descartar", "bi-x-circle", "Descartar", materia.clave, seccion.nrc),
    );

    item.append(asa, ficha, acciones);
    return item;
  }

  function crearDescartada(seccion, materia) {
    const fila = crear("div", "lista__descartada");
    fila.append(
      crearFicha(seccion, {
        clave: materia.clave,
        nombreMateria: materia.nombre,
        estado: "descartada",
        descargada: actual.descargada,
      }),
      crearBoton("recuperar", "bi-arrow-counterclockwise", "Recuperar", materia.clave, seccion.nrc, { visible: true }),
    );
    return fila;
  }

  function alReordenar(clave, ordenNuevo) {
    const nuevas = structuredClone(actual.preferencias);
    nuevas.materias.find((p) => p.clave === clave).orden = ordenNuevo;
    actual = { ...actual, preferencias: nuevas };
    if (alCambiar) alCambiar(structuredClone(nuevas));
  }

  function destruirOrdenables() {
    for (const ordenable of ordenables) ordenable.destroy();
    ordenables = [];
  }

  function buscarSeccion(materia, nrc) {
    const seccion = materia.secciones.find((s) => s.nrc === nrc);
    if (!seccion) throw new Error(`La oferta no tiene la sección ${nrc} de ${materia.clave}`);
    return seccion;
  }

  function pintar() {
    destruirOrdenables();
    contenedor.replaceChildren();

    const materiaPorClave = new Map(actual.materias.map((m) => [m.clave, m]));

    for (const preferencia of actual.preferencias.materias) {
      const materia = materiaPorClave.get(preferencia.clave);
      if (!materia) {
        throw new Error(`Las preferencias incluyen ${preferencia.clave}, pero esa materia no está en la oferta`);
      }

      const lista = crear("section", "lista");
      const encabezado = crear("header", "lista__encabezado");
      encabezado.append(crear("h3", "lista__titulo", materia.nombre));
      encabezado.append(crear("span", "lista__clave", materia.clave));
      lista.append(encabezado);

      const fichas = crear("div", "lista__fichas");
      for (const nrc of preferencia.orden) {
        fichas.append(crearItem(buscarSeccion(materia, nrc), materia, preferencia));
      }
      if (preferencia.orden.length === 0) {
        fichas.append(crear("p", "lista__vacia", "Sin secciones activas: recupera alguna para generar horarios."));
      }
      lista.append(fichas);

      if (preferencia.descartadas.length > 0) {
        const zona = crear("div", "lista__descartadas");
        zona.append(crear("h4", "lista__subtitulo", `Descartadas (${preferencia.descartadas.length})`));
        for (const nrc of preferencia.descartadas) {
          zona.append(crearDescartada(buscarSeccion(materia, nrc), materia));
        }
        lista.append(zona);
      }

      contenedor.append(lista);

      const ordenable = Sortable.create(fichas, {
        animation: 150,
        handle: ".lista__asa",
        draggable: ".lista__item",
        dataIdAttr: "data-nrc",
        onEnd: (evento) => {
          if (evento.oldIndex === evento.newIndex) return;
          alReordenar(materia.clave, ordenable.toArray());
        },
      });
      ordenables.push(ordenable);
    }
  }

  contenedor.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton || !contenedor.contains(boton)) return;

    const { accion, clave, nrc } = boton.dataset;
    if (!ACCIONES[accion]) return;

    const nuevas = ACCIONES[accion](actual.preferencias, clave, nrc);
    actual = { ...actual, preferencias: nuevas };

    pintar();
    const siguiente = contenedor.querySelector(
      `button[data-accion="${FOCO_SIGUIENTE[accion]}"][data-clave="${clave}"][data-nrc="${nrc}"]`,
    );
    if (siguiente) siguiente.focus();

    if (alCambiar) alCambiar(structuredClone(nuevas));
  });

  function actualizar(materias, preferencias, descargada) {
    actual = { materias, preferencias, descargada };
    pintar();
  }

  pintar();
  return { actualizar };
}