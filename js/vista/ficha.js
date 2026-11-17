import { resumirSesiones, textoDescarga } from "./formato.js";

const ESTADOS = ["normal", "fijada", "descartada", "conflicto"];

const INDICADORES = {
  fijada: { icono: "bi-pin-angle-fill", texto: "Fijada" },
  descartada: { icono: "bi-x-circle", texto: "Descartada" },
  conflicto: { icono: "bi-exclamation-triangle-fill", texto: "En conflicto" },
};

// Crea un elemento con clase y texto.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

/**
 * Devuelve un elemento HTML con la ficha de una sección (un NRC).
 *
 * @param {Object} seccion  Seccion del contrato (nrc, seccion, profesor, cupo, disponibles, sesiones)
 * @param {Object} datos    { clave, nombreMateria, rango, estado, descargada? }
 *   - estado: "normal" | "fijada" | "descartada" | "conflicto"
 *   - rango: posición en la lista (0 = favorita). Puede faltar, por ejemplo en la cuadrícula.
 *   - descargada: fecha ISO de la oferta. Opcional; ver nota en la entrega.
 */
export function crearFicha(seccion, datos) {
  const { clave, nombreMateria, rango, estado = "normal", descargada } = datos;
  if (!ESTADOS.includes(estado)) {
    throw new Error(`Estado de ficha desconocido: "${estado}"`);
  }

  const ficha = crear("article", `ficha ficha--${estado}`);
  ficha.dataset.clave = clave;
  ficha.dataset.nrc = seccion.nrc;

  const encabezado = crear("header", "ficha__encabezado");
  encabezado.append(crear("span", "ficha__materia", nombreMateria));
  const indicador = INDICADORES[estado];
  if (indicador) {
    const icono = crear("i", `bi ${indicador.icono} ficha__indicador`);
    icono.setAttribute("role", "img");
    icono.setAttribute("aria-label", indicador.texto);
    icono.title = indicador.texto;
    encabezado.append(icono);
  }
  ficha.append(encabezado);

  const identificacion = crear("div", "ficha__identificacion");
  identificacion.append(crear("span", "ficha__nrc", `NRC ${seccion.nrc}`));
  identificacion.append(crear("span", "ficha__seccion", `Sección ${seccion.seccion}`));
  if (typeof rango === "number") {
    identificacion.append(crear("span", "ficha__rango", `Opción ${rango + 1}`));
  }
  ficha.append(identificacion);

  ficha.append(crear("div", "ficha__profesor", seccion.profesor || "Profesor sin asignar"));

  const horarios = crear("div", "ficha__horarios");
  for (const linea of resumirSesiones(seccion.sesiones)) {
    horarios.append(crear("div", "ficha__horario", linea));
  }
  ficha.append(horarios);

  const hora = textoDescarga(descargada);
  const cupo = `${seccion.disponibles} de ${seccion.cupo} lugares`;
  ficha.append(crear("div", "ficha__cupo", hora ? `${cupo}, al ${hora}` : cupo));

  return ficha;
}
