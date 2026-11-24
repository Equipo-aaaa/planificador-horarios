// Comparación preliminar del Checkpoint 2: búsqueda exhaustiva contra backtracking
// con poda, con problemas aleatorios armados de la oferta real (respaldo 202620).
// Los resultados están en docs/resultados-preliminares.md. Se corre con:
//   node tests/comparacion-preliminar.js
//
// Las semillas son fijas, así que los nodos salen iguales en cualquier computadora;
// los tiempos cambian según la máquina. Las mediciones finales con las tres
// estrategias son de BR-06.
import assert from 'node:assert/strict';
import { buscarBacktracking } from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { ofertaReal, totalCombinaciones } from './problemas-de-prueba.js';

const PROBLEMAS_POR_TAMANO = 20;
// Con 7 materias o más la exhaustiva tarda varios segundos por problema: se mide
// solo el backtracking, igual que el límite de la página de análisis.
const MAX_MATERIAS_EXHAUSTIVA = 6;
const MAX_MATERIAS = 8;
// El backtracking tarda fracciones de milisegundo: se corre varias veces y se toma
// la más rápida, para que el ruido del sistema no domine la medición.
const PASADAS_BACKTRACKING = 5;

const promedio = (lista) => lista.reduce((a, b) => a + b, 0) / lista.length;
const entero = (x) => Math.round(x).toLocaleString('en-US');

console.log('| Materias | Horarios posibles (prom.) | Nodos exhaustiva | Nodos backtracking | Nodos ahorrados | ms exhaustiva | ms backtracking |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');

for (let n = 2; n <= MAX_MATERIAS; n++) {
  const filas = [];
  for (let semilla = 1; semilla <= PROBLEMAS_POR_TAMANO; semilla++) {
    const problema = generarProblemaAleatorio(n, ofertaReal, semilla);
    let backtracking;
    let msBacktracking = Infinity;
    for (let i = 0; i < PASADAS_BACKTRACKING; i++) {
      backtracking = buscarBacktracking(problema);
      msBacktracking = Math.min(msBacktracking, backtracking.estadisticas.ms);
    }
    const fila = { posibles: totalCombinaciones(problema), nodosB: backtracking.estadisticas.nodos, msB: msBacktracking };
    if (n <= MAX_MATERIAS_EXHAUSTIVA) {
      const exhaustiva = buscarExhaustiva(problema);
      // Si el top 3 no coincide, la medición no vale: la poda descartó algo bueno.
      assert.deepEqual(backtracking.opciones, exhaustiva.opciones, `top 3 distinto: n=${n}, semilla=${semilla}`);
      fila.nodosE = exhaustiva.estadisticas.nodos;
      fila.msE = exhaustiva.estadisticas.ms;
    }
    filas.push(fila);
  }

  const posibles = promedio(filas.map((f) => f.posibles));
  const nodosB = promedio(filas.map((f) => f.nodosB));
  const msB = promedio(filas.map((f) => f.msB));
  if (n <= MAX_MATERIAS_EXHAUSTIVA) {
    const nodosE = promedio(filas.map((f) => f.nodosE));
    const msE = promedio(filas.map((f) => f.msE));
    const ahorro = (1 - nodosB / nodosE) * 100;
    console.log(`| ${n} | ${entero(posibles)} | ${entero(nodosE)} | ${entero(nodosB)} | ${ahorro.toFixed(ahorro > 99.9 ? 2 : 1)}% | ${msE.toFixed(1)} | ${msB.toFixed(2)} |`);
  } else {
    console.log(`| ${n} | ${entero(posibles)} | no se midió | ${entero(nodosB)} | — | — | ${msB.toFixed(2)} |`);
  }
}

console.log(`\n${PROBLEMAS_POR_TAMANO} problemas por tamaño (semillas 1 a ${PROBLEMAS_POR_TAMANO}). ` +
  `En todos los problemas medidos con las dos búsquedas, el top 3 fue idéntico.`);
