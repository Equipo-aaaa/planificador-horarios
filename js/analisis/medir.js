export const MAX_COMBINACIONES_EXHAUSTIVA = 1_000_000;

export function estimarCombinaciones(problema) {
  return problema.materias.reduce((producto, materia) => producto * materia.candidatas.length, 1);
}

const cederTurnoPorDefecto = () => new Promise((resolver) => setTimeout(resolver, 0));

function aMedicion(algoritmo, materias, resultado) {
  const { ms, nodos, combinaciones } = resultado.estadisticas;
  return { algoritmo, materias, ms, nodos, combinaciones };
}

export async function medirProblemas(config) {
  const {
    oferta,
    minMaterias,
    maxMaterias,
    repeticiones,
    maxMateriasExhaustiva,
    maxCombinaciones = MAX_COMBINACIONES_EXHAUSTIVA,
    generarProblema,
    buscarBacktracking,
    buscarExhaustiva,
    alProgreso = () => {},
    cancelado = () => false,
    cederTurno = cederTurnoPorDefecto,
  } = config;

  const enteros = [minMaterias, maxMaterias, repeticiones, maxMateriasExhaustiva];
  if (!enteros.every(Number.isInteger)) throw new Error("Los valores deben ser números enteros");
  if (minMaterias < 1) throw new Error("El mínimo de materias debe ser al menos 1");
  if (minMaterias > maxMaterias) throw new Error("El mínimo de materias no puede ser mayor que el máximo");
  if (maxMaterias > oferta.length) {
    throw new Error(`La oferta solo tiene ${oferta.length} materias; baja el máximo`);
  }
  if (repeticiones < 1) throw new Error("Las repeticiones deben ser al menos 1");

  const mediciones = [];
  let omitidasExhaustiva = 0;
  const total = (maxMaterias - minMaterias + 1) * repeticiones;
  let hechos = 0;

  for (let materias = minMaterias; materias <= maxMaterias; materias++) {
    for (let repeticion = 0; repeticion < repeticiones; repeticion++) {
      if (cancelado()) return { mediciones, omitidasExhaustiva, total, cancelado: true };

      const problema = generarProblema(materias, oferta, materias * 1000 + repeticion);

      mediciones.push(aMedicion("backtracking", materias, buscarBacktracking(problema)));

      // En AN-09 se agrega aquí la llamada a la estrategia voraz con la misma
      // clave que se defina en ALGORITMOS de js/vista/grafica.js.

      const cabe = materias <= maxMateriasExhaustiva && estimarCombinaciones(problema) <= maxCombinaciones;
      if (cabe) {
        mediciones.push(aMedicion("exhaustiva", materias, buscarExhaustiva(problema)));
      } else {
        omitidasExhaustiva += 1;
      }

      hechos += 1;
      alProgreso(hechos, total);
      await cederTurno();
    }
  }

  return { mediciones, omitidasExhaustiva, total, cancelado: false };
}