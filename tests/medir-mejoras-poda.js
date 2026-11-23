import assert from 'node:assert/strict';
import { buscarBacktracking, SIN_MEJORAS } from '../js/algoritmo/backtracking.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { ofertaReal } from './problemas-de-prueba.js';

const MATERIAS = [2, 3, 4, 5, 6, 7, 8];
const PROBLEMAS_POR_TAMANO = 100;
const PASADAS_DE_TIEMPO = 5;

const VARIANTES = {
  antes: SIN_MEJORAS,
  soloCota: { ordenMaterias: 'original', cotaIncremental: true },
  soloOrden: { ordenMaterias: 'mas-primero', cotaIncremental: false },
  ambas: { ordenMaterias: 'mas-primero', cotaIncremental: true },
  menosPrimero: { ordenMaterias: 'menos-primero', cotaIncremental: true },
};

const problemasPorN = new Map(
  MATERIAS.map((n) => [
    n,
    Array.from({ length: PROBLEMAS_POR_TAMANO }, (_, i) => generarProblemaAleatorio(n, ofertaReal, i + 1)),
  ])
);

const promedio = (numeros) => numeros.reduce((a, b) => a + b, 0) / numeros.length;
const f0 = (x) => Math.round(x).toLocaleString('en-US');
const f2 = (x) => x.toFixed(2);
const pct = (despues, antes) => `${despues <= antes ? '-' : '+'}${Math.abs((1 - despues / antes) * 100).toFixed(0)}%`;

for (const [n, problemas] of problemasPorN) {
  for (const problema of problemas) {
    const referencia = buscarBacktracking(problema, 3, VARIANTES.antes).opciones;
    for (const [nombre, mejoras] of Object.entries(VARIANTES)) {
      assert.deepEqual(buscarBacktracking(problema, 3, mejoras).opciones, referencia, `${nombre}, n=${n}`);
    }
  }
}

const filasNodos = [];
const totales = { antes: 0, menosPrimero: 0, ambas: 0 };
for (const [n, problemas] of problemasPorN) {
  const nodos = (mejoras) => problemas.map((p) => buscarBacktracking(p, 3, mejoras).estadisticas.nodos);
  const antes = nodos(VARIANTES.antes);
  const menos = nodos(VARIANTES.menosPrimero);
  const mas = nodos(VARIANTES.ambas);

  let mejor = 0;
  let igual = 0;
  let peor = 0;
  mas.forEach((x, i) => {
    if (x < antes[i]) mejor++;
    else if (x === antes[i]) igual++;
    else peor++;
  });
  totales.antes += antes.reduce((a, b) => a + b, 0);
  totales.menosPrimero += menos.reduce((a, b) => a + b, 0);
  totales.ambas += mas.reduce((a, b) => a + b, 0);

  filasNodos.push(
    `| ${n} | ${f0(promedio(antes))} | ${f0(promedio(menos))} (${pct(promedio(menos), promedio(antes))}) | ${f0(promedio(mas))} (${pct(promedio(mas), promedio(antes))}) | ${mejor} / ${igual} / ${peor} |`
  );
}

function msPorProblema(problemas, mejoras) {
  let mejorPasada = Infinity;
  for (let pasada = 0; pasada < PASADAS_DE_TIEMPO; pasada++) {
    let total = 0;
    for (const p of problemas) total += buscarBacktracking(p, 3, mejoras).estadisticas.ms;
    mejorPasada = Math.min(mejorPasada, total);
  }
  return mejorPasada / problemas.length;
}
for (const problemas of problemasPorN.values()) {
  for (const mejoras of Object.values(VARIANTES)) for (const p of problemas) buscarBacktracking(p, 3, mejoras);
}

const filasTiempo = [];
const peorCaso = { antes: 0, ambas: 0 };
for (const [n, problemas] of problemasPorN) {
  const antes = msPorProblema(problemas, VARIANTES.antes);
  const soloCota = msPorProblema(problemas, VARIANTES.soloCota);
  const soloOrden = msPorProblema(problemas, VARIANTES.soloOrden);
  const ambas = msPorProblema(problemas, VARIANTES.ambas);
  peorCaso.antes = Math.max(peorCaso.antes, ...problemas.map((p) => buscarBacktracking(p, 3, VARIANTES.antes).estadisticas.ms));
  peorCaso.ambas = Math.max(peorCaso.ambas, ...problemas.map((p) => buscarBacktracking(p, 3, VARIANTES.ambas).estadisticas.ms));
  filasTiempo.push(
    `| ${n} | ${f2(antes)} | ${f2(soloCota)} (${pct(soloCota, antes)}) | ${f2(soloOrden)} (${pct(soloOrden, antes)}) | ${f2(ambas)} (${pct(ambas, antes)}) |`
  );
}

console.log(`Problemas: oferta real (ciclo 202620), turno matutino, ${PROBLEMAS_POR_TAMANO} por tamaño (semillas 1 a ${PROBLEMAS_POR_TAMANO}).`);
console.log('Las variantes dan el mismo top 3 en todos los problemas (verificado antes de medir).\n');

console.log('### Nodos visitados (promedio por problema)\n');
console.log('| Materias | Antes (orden original) | Menos secciones primero | Más secciones primero | Mejor / igual / peor (más primero vs antes) |');
console.log('| --- | --- | --- | --- | --- |');
console.log(filasNodos.join('\n'));
console.log(`\nTotal de nodos en los ${MATERIAS.length * PROBLEMAS_POR_TAMANO} problemas: antes ${f0(totales.antes)}, menos primero ${f0(totales.menosPrimero)} (${pct(totales.menosPrimero, totales.antes)}), más primero ${f0(totales.ambas)} (${pct(totales.ambas, totales.antes)}).`);

console.log('\n### Tiempo por problema (ms, mejor de varias pasadas)\n');
console.log('| Materias | Antes | Solo cota incremental | Solo orden (más primero) | Las dos mejoras |');
console.log('| --- | --- | --- | --- | --- |');
console.log(filasTiempo.join('\n'));
console.log(`\nPeor caso individual: antes ${f2(peorCaso.antes)} ms, con las dos mejoras ${f2(peorCaso.ambas)} ms.`);
