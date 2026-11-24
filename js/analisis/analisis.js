import { montarGrafica } from "../vista/grafica.js";
import { medirProblemas } from "./medir.js";

import { buscarBacktracking } from "../algoritmo/backtracking.js";
import { buscarExhaustiva } from "../algoritmo/exhaustiva.js";
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
      alProgreso: actualizarProgreso,
      cancelado: () => cancelar,
    });

    grafica.mostrar(resultado.mediciones);

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
    oferta = datos.materias;

    campos.maximo.max = String(oferta.length);
    textoEstado.textContent = `Oferta del ciclo ${datos.ciclo}: ${oferta.length} materias (respaldo).`;
    botonMedir.disabled = false;
  } catch (error) {
    textoEstado.textContent = "";
    mostrarError(`No se pudo preparar la página: ${error.message}`);
  }
}

botonMedir.addEventListener("click", medir);
botonDetener.addEventListener("click", () => { cancelar = true; });
iniciar();