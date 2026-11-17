// Punto de entrada del núcleo: los demás módulos importan todo desde aquí,
// sin necesidad de saber en qué archivo vive cada función.
//   import { evaluar, compararOpciones } from '../nucleo/index.js';
export { seEmpalman, empalmesDe, materiasEnConflicto } from './empalmes.js';
export {
  PESO_PRIORIDAD,
  TURNOS,
  minutosFueraDeTurno,
  minutosDeHuecos,
  costoCandidata,
  evaluar,
  crearOpcion,
  compararOpciones,
} from './puntaje.js';
export { cotaOptimista, debePodar } from './cota.js';
export { construirProblema, editarOpcion } from './problema.js';
