import assert from 'node:assert/strict';
import os from 'node:os';
import { buscarBacktracking } from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { buscarVoraz } from '../js/algoritmo/voraz.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { compararOpciones } from '../js/nucleo/index.js';
import { nodosDeArbol, ofertaReal, totalCombinaciones } from './problemas-de-prueba.js';

const argumento = (nombre, predeterminado) => {
  const a = process.argv.find((x) => x.startsWith(`--${nombre}=`));
  return a ? Number(a.split('=')[1]) : predeterminado;
};

const MATERIAS = [2, 3, 4, 5, 6, 7, 8];
const PROBLEMAS_POR_TAMANO = argumento('problemas', 100);
const LIMITE_EXHAUSTIVA = argumento('limite', 1_000_000);
const PASADAS = 5;
const LIMITE_BACKTRACKING_MS = 1000;

const promedio = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const n0 = (x) => Math.round(x).toLocaleString('en-US');
const ms = (x) => (x < 0.1 ? x.toFixed(3) : x < 100 ? x.toFixed(2) : n0(x));

function medir(buscar, problema) {
  let resultado = null;
  let mejor = Infinity;
  for (let pasada = 0; pasada < PASADAS; pasada++) {
    resultado = buscar(problema);
    mejor = Math.min(mejor, resultado.estadisticas.ms);
  }
  return { resultado, ms: mejor };
}

const filas = [];
let peorBacktracking8 = 0;

for (const n of MATERIAS) {
  process.stderr.write(`Midiendo ${n} materias... `);
  const problemas = Array.from({ length: PROBLEMAS_POR_TAMANO }, (_, i) => generarProblemaAleatorio(n, ofertaReal, i + 1));

  for (const p of problemas) {
    buscarBacktracking(p);
    buscarVoraz(p);
  }

  const horarios = problemas.map(totalCombinaciones);
  const nodosExhaustiva = problemas.map((p) => nodosDeArbol(p.materias.map((m) => m.candidatas.length)));

  const bt = problemas.map((p) => medir(buscarBacktracking, p));
  const voraz = problemas.map((p) => medir(buscarVoraz, p));

  const msExhaustiva = new Array(problemas.length).fill(null);
  problemas.forEach((p, i) => {
    if (horarios[i] > LIMITE_EXHAUSTIVA) return;
    const e = buscarExhaustiva(p);
    msExhaustiva[i] = e.estadisticas.ms;
    assert.equal(e.estadisticas.nodos, nodosExhaustiva[i], `la fórmula de nodos no coincide (n=${n}, semilla ${i + 1})`);
    assert.equal(e.estadisticas.combinaciones, horarios[i]);
    assert.deepEqual(bt[i].resultado.opciones, e.opciones, `backtracking y exhaustiva difieren (n=${n}, semilla ${i + 1})`);
  });
  const medidas = msExhaustiva.map((x, i) => (x === null ? -1 : i)).filter((i) => i >= 0);

  let mismoHorario = 0;
  let conMasChoques = 0;
  problemas.forEach((p, i) => {
    const v = voraz[i].resultado.opciones[0];
    const mejor = bt[i].resultado.opciones[0];
    const cmp = compararOpciones(v, mejor);
    assert.ok(cmp >= 0, `la voraz le ganó al backtracking (n=${n}, semilla ${i + 1})`);
    if (cmp === 0) mismoHorario++;
    if (v.puntaje.conflictos > mejor.puntaje.conflictos) conMasChoques++;
  });

  const btMs = bt.map((x) => x.ms);
  if (n === Math.max(...MATERIAS)) peorBacktracking8 = Math.max(...btMs);

  filas.push({
    n,
    horarios: promedio(horarios),
    nodosExhaustiva: promedio(nodosExhaustiva),
    msExhaustiva: medidas.length ? promedio(medidas.map((i) => msExhaustiva[i])) : null,
    medidas: medidas.length,
    msBacktrackingMismos: medidas.length ? promedio(medidas.map((i) => btMs[i])) : null,
    nodosBacktracking: promedio(bt.map((x) => x.resultado.estadisticas.nodos)),
    msBacktracking: promedio(btMs),
    peorBacktracking: Math.max(...btMs),
    nodosVoraz: promedio(voraz.map((x) => x.resultado.estadisticas.nodos)),
    msVoraz: promedio(voraz.map((x) => x.ms)),
    mismoHorario,
    conMasChoques,
  });
  process.stderr.write('listo\n');
}

const N = PROBLEMAS_POR_TAMANO;
const cpu = os.cpus()[0]?.model.trim() ?? 'CPU desconocida';
const tabla = [];
tabla.push(`### Las tres estrategias con la oferta real (promedio por problema)`);
tabla.push('');
tabla.push('| Materias | Horarios posibles | Exhaustiva: nodos | Exhaustiva: ms | Backtracking: nodos | Backtracking: ms | Voraz: nodos | Voraz: ms | Voraz = backtracking |');
tabla.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const f of filas) {
  const exhaustiva = f.msExhaustiva === null ? 'no se midió' : `${ms(f.msExhaustiva)}${f.medidas < N ? ` (${f.medidas} de ${N})` : ''}`;
  tabla.push(
    `| ${f.n} | ${n0(f.horarios)} | ${n0(f.nodosExhaustiva)} | ${exhaustiva} | ${n0(f.nodosBacktracking)} | ${ms(f.msBacktracking)} | ${n0(f.nodosVoraz)} | ${ms(f.msVoraz)} | ${f.mismoHorario} de ${N} |`
  );
}
tabla.push('');
tabla.push(
  `Problemas armados con la oferta real (ciclo 202620) y turno matutino: ${N} por tamaño, con las semillas 1 a ${N} de \`generarProblemaAleatorio\`. ` +
    `Los nodos son deterministas y salen iguales en cualquier computadora; los tiempos dependen de la computadora (aquí: Node ${process.version}, ${cpu}).`
);
tabla.push('');
tabla.push('- **Backtracking:** con las dos mejoras de BR-05 (más secciones primero y cota incremental). El tiempo es el mejor de ' + `${PASADAS} pasadas por problema.`);
tabla.push(`- **Exhaustiva, nodos:** calculados con la suma de productos parciales. Mientras se ejecutó, el script comprobó que coincide con lo que cuenta la búsqueda y que da el mismo top 3 que el backtracking.`);
tabla.push(`- **Exhaustiva, tiempo:** solo se ejecuta en problemas de hasta ${n0(LIMITE_EXHAUSTIVA)} horarios posibles, porque con más congela el navegador. Entre paréntesis, en cuántos de los ${N} problemas se midió. El promedio es de esos problemas, que son los más chicos, así que subestima el tiempo real.`);
tabla.push(`- **Voraz = backtracking:** en cuántos problemas la voraz dio exactamente el mismo horario que la mejor opción del backtracking. Nunca fue mejor.`);

tabla.push('');
tabla.push('### Detalle');
tabla.push('');
tabla.push('| Materias | Exhaustiva ÷ backtracking (tiempo, mismos problemas) | Backtracking: peor caso (ms) | Voraz: choques que el backtracking evita |');
tabla.push('| --- | --- | --- | --- |');
for (const f of filas) {
  const razon = f.msExhaustiva === null ? 'no se midió' : `${n0(f.msExhaustiva / f.msBacktrackingMismos)}×`;
  tabla.push(`| ${f.n} | ${razon} | ${ms(f.peorBacktracking)} | ${f.conMasChoques} de ${N} |`);
}

const ok = peorBacktracking8 < LIMITE_BACKTRACKING_MS;
tabla.push('');
tabla.push(
  `${ok ? '✔' : '✘'} Con ${Math.max(...MATERIAS)} materias el backtracking responde en menos de un segundo: el peor de ${N} problemas tardó ${ms(peorBacktracking8)} ms.`
);

console.log(tabla.join('\n'));
if (!ok) process.exitCode = 1;
