import { crearFicha } from "./ficha.js";

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

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

  function crearItem(seccion, materia, preferencia) {
    const item = crear("div", "lista__item");
    item.dataset.nrc = seccion.nrc;

    const asa = crear("span", "lista__asa");
    asa.setAttribute("role", "img");
    asa.setAttribute("aria-label", "Arrastrar para reordenar");
    asa.title = "Arrastrar para reordenar";
    asa.append(crear("i", "bi bi-grip-vertical"));

    const estado = preferencia.fijada === seccion.nrc ? "fijada" : "normal";
    const ficha = crearFicha(seccion, {
      clave: materia.clave,
      nombreMateria: materia.nombre,
      estado,
      descargada: actual.descargada,
    });

    item.append(asa, ficha);
    return item;
  }

  function alReordenar(clave, ordenNuevo) {
    const nuevas = structuredClone(actual.preferencias);
    const preferencia = nuevas.materias.find((p) => p.clave === clave);
    preferencia.orden = ordenNuevo;
    actual = { ...actual, preferencias: nuevas };
    if (alCambiar) alCambiar(structuredClone(nuevas));
  }

  function destruirOrdenables() {
    for (const ordenable of ordenables) ordenable.destroy();
    ordenables = [];
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
        const seccion = materia.secciones.find((s) => s.nrc === nrc);
        if (!seccion) {
          throw new Error(`La oferta no tiene la sección ${nrc} de ${materia.clave}`);
        }
        fichas.append(crearItem(seccion, materia, preferencia));
      }
      lista.append(fichas);
      contenedor.append(lista);

      const ordenable = Sortable.create(fichas, {
        animation: 150,
        handle: ".lista__asa",
        dataIdAttr: "data-nrc",
        onEnd: (evento) => {
          if (evento.oldIndex === evento.newIndex) return;
          alReordenar(materia.clave, ordenable.toArray());
        },
      });
      ordenables.push(ordenable);
    }
  }

  function actualizar(materias, preferencias, descargada) {
    actual = { materias, preferencias, descargada };
    pintar();
  }

  pintar();
  return { actualizar };
}