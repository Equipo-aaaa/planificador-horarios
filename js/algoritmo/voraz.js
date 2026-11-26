import { crearOpcion, costoCandidata, seEmpalman } from '../nucleo/index.js';

export function buscarVoraz(problema) {
  const inicio = performance.now();
  const { materias, turno, sinOpciones } = problema;

  let nodos = 0;
  const seleccion = [];

  for (const materia of materias) {
    let elegida = null;
    let masBarata = null; 
    let costoMasBarata = Infinity;

    for (const candidata of materia.candidatas) {
      nodos++; 
      const choca = seleccion.some((ya) => seEmpalman(ya.seccion, candidata.seccion));

      if (!choca) {
        elegida = candidata; 
        break;
      }
      const costo = costoCandidata(candidata, turno);
      if (costo < costoMasBarata) {
        costoMasBarata = costo;
        masBarata = candidata;
      }
    }

    seleccion.push(elegida ?? masBarata);
  }

  const opciones = materias.length > 0 ? [crearOpcion(seleccion, turno)] : [];

  return {
    opciones,
    sinOpciones: [...sinOpciones],
    estadisticas: {
      nodos,
      combinaciones: opciones.length,
      ms: performance.now() - inicio,
    },
  };
}