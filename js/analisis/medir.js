export const MAX_COMBINACIONES_EXHAUSTIVA = 1_000_000;

export function estimarCombinaciones(problema) {
  return problema.materias.reduce((producto, materia) => producto * materia.candidatas.length, 1);
}

export function mismoHorario(resultadoA, resultadoB) {
  const a = resultadoA.opciones[0];
  const b = resultadoB.opciones[0];
  if (!a || !b) return false;
  if (a.secciones.length !== b.secciones.length) return false;
  const nrcPorClave = new Map(b.secciones.map((seccion) => [seccion.clave, seccion.nrc]));
  return a.secciones.every((seccion) => nrcPorClave.get(seccion.clave) === seccion.nrc);
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
    buscarVoraz,
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
  if (typeof buscarVoraz !== "function") throw new Error("Falta la función buscarVoraz");

  const mediciones = [];
  let omitidasExhaustiva = 0;
  const total = (maxMaterias - minMaterias + 1) * repeticiones;
  let hechos = 0;

  const vorazPorMaterias = new Map();
  let vorazProblemas = 0;
  let vorazOptimas = 0;

  const resultado = (esCancelado) => ({
    mediciones,
    omitidasExhaustiva,
    total,
    cancelado: esCancelado,
    voraz: {
      problemas: vorazProblemas,
      optimas: vorazOptimas,
      porMaterias: [...vorazPorMaterias.values()].sort((a, b) => a.materias - b.materias),
    },
  });

  for (let materias = minMaterias; materias <= maxMaterias; materias++) {
    for (let repeticion = 0; repeticion < repeticiones; repeticion++) {
      if (cancelado()) return resultado(true);

      const problema = generarProblema(materias, oferta, materias * 1000 + repeticion);

      const deBacktracking = buscarBacktracking(problema);
      mediciones.push(aMedicion("backtracking", materias, deBacktracking));

      const deVoraz = buscarVoraz(problema);
      mediciones.push(aMedicion("voraz", materias, deVoraz));

      const grupo = vorazPorMaterias.get(materias) ?? { materias, problemas: 0, optimas: 0 };
      grupo.problemas += 1;
      vorazProblemas += 1;
      if (mismoHorario(deVoraz, deBacktracking)) {
        grupo.optimas += 1;
        vorazOptimas += 1;
      }
      vorazPorMaterias.set(materias, grupo);

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

  return resultado(false);
}