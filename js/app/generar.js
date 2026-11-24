// Lo que pasa al presionar Generar, sin tocar la página: cruzar la oferta con las
// preferencias y correr el backtracking. Vive aparte de app.js para poder probar
// el flujo completo en Node con los escenarios de ejemplo (tests/pruebas-opciones.js).
import { construirProblema } from '../nucleo/index.js';
import { buscarBacktracking } from '../algoritmo/backtracking.js';

// Cuántas opciones se muestran (las pestañas Opción 1, 2, 3).
export const NUM_OPCIONES = 3;

// materias: Materia[] de las materias agregadas. preferencias: Preferencias.
// Devuelve el Problema (lo necesitará la edición manual, DI-09) y el
// ResultadoBusqueda del backtracking.
export function generarOpciones(materias, preferencias) {
  const problema = construirProblema(materias, preferencias);
  const resultado = buscarBacktracking(problema, NUM_OPCIONES);
  return { problema, resultado };
}
