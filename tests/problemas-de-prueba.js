import { readFileSync } from 'node:fs';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { TURNOS } from '../js/nucleo/index.js';
export const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url)));
export const ofertaEjemplo = leer('../ejemplos/oferta-ejemplo.json').materias; 
export const ofertaReal = leer('../datos/oferta-202620.json').materias; 
export const totalCombinaciones = (problema) =>
  problema.materias.reduce((producto, m) => producto * m.candidatas.length, 1);

export function nodosDeArbol(conteos) {
  let nodos = 0;
  let nivel = 1;
  for (const c of conteos) {
    nivel *= c;
    nodos += nivel;
  }
  return nodos;
}

const TOPE_COMBINACIONES = 30000;
const TURNOS_A_PROBAR = [TURNOS.matutino, TURNOS.vespertino, TURNOS.libre];

export function crearProblemas() {
  const problemas = [];

  for (let semilla = 1; semilla <= 120; semilla++) {
    const n = 1 + (semilla % ofertaEjemplo.length); 
    problemas.push({ origen: `ejemplo n=${n} semilla=${semilla}`, problema: generarProblemaAleatorio(n, ofertaEjemplo, semilla) });
  }

  for (let semilla = 1; problemas.length < 270 && semilla <= 2000; semilla++) {
    const n = 2 + (semilla % 5); 
    const problema = generarProblemaAleatorio(n, ofertaReal, semilla);
    if (totalCombinaciones(problema) > TOPE_COMBINACIONES) continue;
    problemas.push({ origen: `real n=${n} semilla=${semilla}`, problema });
  }

  for (let semilla = 1; semilla <= 150; semilla++) {
    const n = 4 + (semilla % 5); 
    const completo = generarProblemaAleatorio(n, ofertaReal, 5000 + semilla);
    const conservar = 1 + (semilla % 3);
    const problema = {
      ...completo,
      materias: completo.materias.map((m) => ({ ...m, candidatas: m.candidatas.slice(0, conservar) })),
    };
    problemas.push({ origen: `apretado n=${n} conservar=${conservar} semilla=${5000 + semilla}`, problema });
  }

  return problemas.map((p, i) => ({
    ...p,
    problema: { ...p.problema, turno: { ...TURNOS_A_PROBAR[i % 3] } },
  }));
}
