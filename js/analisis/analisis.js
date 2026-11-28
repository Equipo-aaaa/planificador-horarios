import { montarGrafica } from "../vista/grafica.js";
import { medirProblemas } from "./medir.js";
import { buscarBacktracking } from "../algoritmo/backtracking.js";
import { buscarExhaustiva } from "../algoritmo/exhaustiva.js";
import { buscarVoraz } from "../algoritmo/voraz.js";
import { generarProblemaAleatorio } from "../algoritmo/aleatorio.js";

const CICLO_RESPALDO = "202620";
const RUTA_RESPALDO = `datos/oferta-${CICLO_RESPALDO}.json`;

const $ = (id) => document.getElementById(id);
const campos = {
  minimo: $("min-materias"),
  maximo: $("max-materias"),
  repeticiones: $("repeticiones"),
  limite: $("limite-exhaustiva"),
};
const botonMedir = $("medir");
const botonDetener = $("detener");
const barra = $("progreso-barra");
const contenedorProgreso = $("progreso");
const textoEstado = $("estado");
const textoError = $("error");
const panelVoraz = $("voraz");
const textoVoraz = $("voraz-resumen");
const cuerpoVoraz = $("voraz-cuerpo");

let oferta = [];
let cancelar = false;
let grafica = null;

function mostrarError(mensaje) {
  textoError.textContent = mensaje;
  textoError.hidden = false;
}

function limpiarError() {
  textoError.hidden = true;
}

function porcentaje(optimas, problemas) {
  if (problemas === 0) return "—";
  return `${Math.round((optimas / problemas) * 100)}%`;
}

function textoProporcion(optimas, problemas) {
  if (problemas === 0) return "sin problemas";
  return `${optimas} de ${problemas} (${porcentaje(optimas, problemas)})`;
}

function mostrarVoraz(voraz) {
  if (voraz.problemas === 0) {
    panelVoraz.hidden = true;
    return;
  }
  textoVoraz.textContent =
    `La estrategia voraz dio el mismo horario que el backtracking en ${textoProporcion(voraz.optimas, voraz.problemas)} de los problemas.`;

  cuerpoVoraz.replaceChildren();
  for (const fila of voraz.porMaterias) {
    const renglon = document.createElement("tr");
    for (const dato of [fila.materias, fila.problemas, fila.optimas, porcentaje(fila.optimas, fila.problemas)]) {
      const celda = document.createElement("td");
      celda.textContent = String(dato);
      renglon.append(celda);
    }
    cuerpoVoraz.append(renglon);
  }
  panelVoraz.hidden = false;
}

function actualizarProgreso(hechos, total) {
  const porcentaje = Math.round((hechos / total) * 100);
  barra.style.width = `${porcentaje}%`;
  barra.textContent = `${porcentaje}%`;
  contenedorProgreso.setAttribute("aria-valuenow", String(porcentaje));
}

function fijarMedicion(enCurso) {
  botonMedir.disabled = enCurso;
  botonDetener.hidden = !enCurso;
  contenedorProgreso.hidden = !enCurso;
  for (const campo of Object.values(campos)) campo.disabled = enCurso;
}

async function medir() {
  limpiarError();
  panelVoraz.hidden = true;
  cancelar = false;
  fijarMedicion(true);
  actualizarProgreso(0, 1);
  textoEstado.textContent = "Midiendo…";

  try {
    const resultado = await medirProblemas({
      oferta,
      minMaterias: campos.minimo.valueAsNumber,
      maxMaterias: campos.maximo.valueAsNumber,
      repeticiones: campos.repeticiones.valueAsNumber,
      maxMateriasExhaustiva: campos.limite.valueAsNumber,
      generarProblema: generarProblemaAleatorio,
      buscarBacktracking,
      buscarExhaustiva,
      buscarVoraz,
      alProgreso: actualizarProgreso,
      cancelado: () => cancelar,
    });

    grafica.mostrar(resultado.mediciones);
    mostrarVoraz(resultado.voraz);

    const partes = [`${resultado.mediciones.length} mediciones`];
    if (resultado.omitidasExhaustiva > 0) {
      partes.push(
        `la exhaustiva se omitió en ${resultado.omitidasExhaustiva} de ${resultado.total} problemas ` +
        `(superaban el límite de materias o de combinaciones)`,
      );
    }
    if (resultado.cancelado) partes.push("medición detenida antes de terminar");
    textoEstado.textContent = partes.join("; ") + ".";
  } catch (error) {
    textoEstado.textContent = "";
    mostrarError(error.message);
  } finally {
    fijarMedicion(false);
  }
}

async function iniciar() {
  try {
    grafica = montarGrafica($("grafica"));

    const respuesta = await fetch(RUTA_RESPALDO);
    if (!respuesta.ok) throw new Error(`No se pudo leer ${RUTA_RESPALDO} (${respuesta.status})`);
    const datos = await respuesta.json();
    oferta = datos.materias.filter((materia) => materia.secciones.length > 0);

    campos.maximo.max = String(oferta.length);
    textoEstado.textContent = `Oferta del ciclo ${datos.ciclo}: ${oferta.length} materias (respaldo).`;
    botonMedir.disabled = false;
  } catch (error) {
    mostrarError(`No se pudo preparar la página: ${error.message}`);
  }
}

botonMedir.addEventListener("click", medir);
botonDetener.addEventListener("click", () => { cancelar = true; });
iniciar();