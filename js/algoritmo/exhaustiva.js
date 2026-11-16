import { crearOpcion, compararOpciones } from './nucleo-provisional.js';

function insertarEnTop(top, opcion, k) {
  let posicion = top.length;
  for (let i = 0; i < top.length; i++) {
    if (compararOpciones(opcion, top[i]) < 0) {
      posicion = i;
      break;
    }
  }
  top.splice(posicion, 0, opcion); 
  if (top.length > k) top.pop(); 
}

export function buscarExhaustiva(problema, k = 3) {
  const inicio = performance.now();
  const { materias, turno, sinOpciones } = problema;

  const top = [];
  let nodos = 0;
  let combinaciones = 0;

  const seleccion = [];
  function recorrer(nivel) {
    if (nivel === materias.length) {
      combinaciones++;
      insertarEnTop(top, crearOpcion(seleccion, turno), k);
      return;
    }
    for (const candidata of materias[nivel].candidatas) {
      nodos++; 
      seleccion.push(candidata);
      recorrer(nivel + 1);
      seleccion.pop(); 
    }
  }

  if (materias.length > 0) recorrer(0);

  return {
    opciones: top,
    sinOpciones: [...sinOpciones],
    estadisticas: { nodos, combinaciones, ms: performance.now() - inicio },
  };
}