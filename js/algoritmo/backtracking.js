import {
  crearOpcion,
  compararOpciones,
  cotaOptimista,
  debePodar,
} from '../nucleo/index.js';

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

export function buscarBacktracking(problema, k = 3) {
  const inicio = performance.now();
  const { materias, turno, sinOpciones } = problema;

  const top = [];
  let nodos = 0;
  let combinaciones = 0;

  const seleccion = []; 

  function recorrer(nivel) {
    const restantes = materias.slice(nivel + 1); 
    const esUltimo = nivel === materias.length - 1;

    for (const candidata of materias[nivel].candidatas) {
      nodos++; 
      seleccion.push(candidata);

      const podar =
        top.length === k &&
        debePodar(cotaOptimista(seleccion, restantes, turno), top[k - 1]);

      if (!podar) {
        if (esUltimo) {
          combinaciones++;
          insertarEnTop(top, crearOpcion(seleccion, turno), k);
        } else {
          recorrer(nivel + 1);
        }
      }
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
