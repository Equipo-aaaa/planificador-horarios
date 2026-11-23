
import assert from 'node:assert/strict';
import {
  buscarBacktracking,
  MEJORAS_PREDETERMINADAS,
  ORDENES_MATERIAS,
  SIN_MEJORAS,
} from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { crearProblemas, ofertaReal } from './problemas-de-prueba.js';

let pruebas = 0;
function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

const VARIANTES = [];
for (const ordenMaterias of ORDENES_MATERIAS) {
  for (const cotaIncremental of [false, true]) {
    VARIANTES.push({ nombre: `${ordenMaterias}, cota ${cotaIncremental ? 'incremental' : 'completa'}`, mejoras: { ordenMaterias, cotaIncremental } });
  }
}

const problemas = crearProblemas();
const referencias = problemas.map(({ problema }) => buscarExhaustiva(problema));

prueba('sin mejoras y predeterminadas están definidas como se espera', () => {
  assert.deepEqual(SIN_MEJORAS, { ordenMaterias: 'original', cotaIncremental: false });
  assert.deepEqual(MEJORAS_PREDETERMINADAS, { ordenMaterias: 'mas-primero', cotaIncremental: true });
});

prueba('un orden de materias desconocido lanza un error claro', () => {
  assert.throws(
    () => buscarBacktracking(problemas[0].problema, 3, { ordenMaterias: 'alfabetico' }),
    RangeError
  );
});

for (const { nombre, mejoras } of VARIANTES) {
  prueba(`${nombre}: mismo top 3 que la exhaustiva en los ${problemas.length} problemas`, () => {
    problemas.forEach(({ origen, problema }, i) => {
      const resultado = buscarBacktracking(problema, 3, mejoras);
      assert.deepEqual(resultado.opciones, referencias[i].opciones, origen);
      assert.deepEqual(resultado.sinOpciones, referencias[i].sinOpciones, origen);
    });
  });
}

prueba('el predeterminado también coincide con otros valores de k (1, 2 y 5)', () => {
  for (const { origen, problema } of problemas.slice(0, 120)) {
    for (const k of [1, 2, 5]) {
      assert.deepEqual(
        buscarBacktracking(problema, k).opciones,
        buscarExhaustiva(problema, k).opciones,
        `${origen} k=${k}`
      );
    }
  }
});

prueba('las secciones y los empalmes salen en el orden original de las materias', () => {
  const problema = generarProblemaAleatorio(6, ofertaReal, 3);
  const conteos = problema.materias.map((m) => m.candidatas.length);
  assert.notDeepEqual(conteos, [...conteos].sort((a, b) => b - a), 'el problema ya venía ordenado');
  for (const orden of ORDENES_MATERIAS) {
    for (const opcion of buscarBacktracking(problema, 3, { ordenMaterias: orden }).opciones) {
      assert.deepEqual(
        opcion.secciones.map((s) => s.clave),
        problema.materias.map((m) => m.clave),
        orden
      );
    }
  }
});

prueba('no modifica el problema que recibe', () => {
  for (const orden of ORDENES_MATERIAS) {
    const problema = generarProblemaAleatorio(6, ofertaReal, 3);
    const antes = JSON.stringify(problema);
    buscarBacktracking(problema, 3, { ordenMaterias: orden });
    assert.equal(JSON.stringify(problema), antes, orden);
  }
});

for (const ordenMaterias of ORDENES_MATERIAS) {
  prueba(`orden '${ordenMaterias}': la cota incremental visita exactamente los mismos nodos`, () => {
    for (const { origen, problema } of problemas) {
      const completa = buscarBacktracking(problema, 3, { ordenMaterias, cotaIncremental: false }).estadisticas;
      const incremental = buscarBacktracking(problema, 3, { ordenMaterias, cotaIncremental: true }).estadisticas;
      assert.equal(incremental.nodos, completa.nodos, origen);
      assert.equal(incremental.combinaciones, completa.combinaciones, origen);
    }
  });
}

prueba('con materias del mismo tamaño el orden no cambia nada', () => {
  let probados = 0;
  for (let semilla = 900; probados < 30 && semilla < 1200; semilla++) {
    const g = generarProblemaAleatorio(5, ofertaReal, semilla);
    const problema = { ...g, materias: g.materias.map((m) => ({ ...m, candidatas: m.candidatas.slice(0, 2) })) };
    if (!problema.materias.every((m) => m.candidatas.length === 2)) continue;
    const nodos = ORDENES_MATERIAS.map((o) => buscarBacktracking(problema, 3, { ordenMaterias: o }).estadisticas.nodos);
    assert.equal(new Set(nodos).size, 1, `semilla ${semilla}: ${nodos}`);
    probados++;
  }
  assert.equal(probados, 30, 'no se encontraron suficientes problemas con materias del mismo tamaño');
});

prueba("con la oferta real, 'mas-primero' ahorra nodos y 'menos-primero' los aumenta", () => {
  const reales = problemas.filter((p) => p.origen.startsWith('real n='));
  assert.ok(reales.length >= 100);
  const total = (ordenMaterias) =>
    reales.reduce(
      (suma, { problema }) => suma + buscarBacktracking(problema, 3, { ordenMaterias, cotaIncremental: true }).estadisticas.nodos,
      0
    );
  const original = total('original');
  const menos = total('menos-primero');
  const mas = total('mas-primero');
  console.log(`      (nodos en ${reales.length} problemas reales: original ${original}, menos-primero ${menos}, mas-primero ${mas})`);
  assert.ok(mas < 0.9 * original, "'mas-primero' debería ahorrar al menos 10% de los nodos");
  assert.ok(menos > 1.1 * original, "'menos-primero' debería costar al menos 10% más nodos");
});

console.log(`\n${pruebas} pruebas pasaron`);
