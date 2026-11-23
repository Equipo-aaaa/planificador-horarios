
import {
  crearOpcion,
  compararOpciones,
  cotaOptimista,
  costoCandidata,
  debePodar,
  seEmpalman,
} from '../nucleo/index.js';

export const ORDENES_MATERIAS = Object.freeze(['original', 'menos-primero', 'mas-primero']);
export const MEJORAS_PREDETERMINADAS = Object.freeze({
  ordenMaterias: 'mas-primero',
  cotaIncremental: true,
});
export const SIN_MEJORAS = Object.freeze({ ordenMaterias: 'original', cotaIncremental: false });

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

function ordenarNiveles(materias, ordenMaterias) {
  const niveles = materias.map((materia, indice) => ({ materia, indice }));
  if (ordenMaterias === 'menos-primero') {
    niveles.sort((a, b) => a.materia.candidatas.length - b.materia.candidatas.length || a.indice - b.indice);
  } else if (ordenMaterias === 'mas-primero') {
    niveles.sort((a, b) => b.materia.candidatas.length - a.materia.candidatas.length || a.indice - b.indice);
  }
  return niveles;
}

export function buscarBacktracking(problema, k = 3, mejoras = {}) {
  const { ordenMaterias, cotaIncremental } = { ...MEJORAS_PREDETERMINADAS, ...mejoras };
  if (!ORDENES_MATERIAS.includes(ordenMaterias)) {
    throw new RangeError(`ordenMaterias desconocido: ${ordenMaterias}`);
  }

  const inicio = performance.now();
  const { turno, sinOpciones } = problema;

  const niveles = ordenarNiveles(problema.materias, ordenMaterias);
  const total = niveles.length;
  const materiasPorNivel = niveles.map((n) => n.materia);

  const top = [];
  let nodos = 0;
  let combinaciones = 0;

  const seleccion = []; 
  let costos = null;
  let sufijo = null;
  let choques = null;
  let costoAcumulado = 0;
  let enConflicto = 0;
  const cota = { conflictos: 0, costo: 0 }; 
  if (cotaIncremental) {
    costos = materiasPorNivel.map((m) => m.candidatas.map((c) => costoCandidata(c, turno)));
    sufijo = new Array(total).fill(0);
    for (let nivel = total - 2; nivel >= 0; nivel--) {
      sufijo[nivel] = sufijo[nivel + 1] + Math.min(...costos[nivel + 1]);
    }
    choques = new Array(total).fill(0);
  }

  function evaluarHorarioCompleto() {
    const enOrdenOriginal = new Array(total);
    for (let nivel = 0; nivel < total; nivel++) {
      enOrdenOriginal[niveles[nivel].indice] = seleccion[nivel];
    }
    combinaciones++;
    insertarEnTop(top, crearOpcion(enOrdenOriginal, turno), k);
  }

  function recorrer(nivel) {
    const candidatas = materiasPorNivel[nivel].candidatas;
    const esUltimo = nivel === total - 1;
    const restantes = cotaIncremental ? null : materiasPorNivel.slice(nivel + 1);

    for (let j = 0; j < candidatas.length; j++) {
      const candidata = candidatas[j];
      nodos++; 
      seleccion.push(candidata);

      let chocaCon = null; 
      let podar = false;

      if (cotaIncremental) {
        costoAcumulado += costos[nivel][j];
        for (let i = 0; i < nivel; i++) {
          if (seEmpalman(seleccion[i].seccion, candidata.seccion)) {
            if (chocaCon === null) chocaCon = [];
            chocaCon.push(i);
          }
        }
        if (chocaCon !== null) {
          for (const i of chocaCon) {
            if (choques[i]++ === 0) enConflicto++; 
          }
          choques[nivel] = chocaCon.length;
          enConflicto++; 
        }
        if (top.length === k) {
          cota.conflictos = enConflicto;
          cota.costo = costoAcumulado + sufijo[nivel];
          podar = debePodar(cota, top[k - 1]);
        }
      } else {
        podar = top.length === k && debePodar(cotaOptimista(seleccion, restantes, turno), top[k - 1]);
      }

      if (!podar) {
        if (esUltimo) evaluarHorarioCompleto();
        else recorrer(nivel + 1);
      }
      if (cotaIncremental) {
        if (chocaCon !== null) {
          for (const i of chocaCon) {
            if (--choques[i] === 0) enConflicto--;
          }
          choques[nivel] = 0;
          enConflicto--;
        }
        costoAcumulado -= costos[nivel][j];
      }
      seleccion.pop();
    }
  }

  if (total > 0) recorrer(0);

  return {
    opciones: top,
    sinOpciones: [...sinOpciones],
    estadisticas: { nodos, combinaciones, ms: performance.now() - inicio },
  };
}
