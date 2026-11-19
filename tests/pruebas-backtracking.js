
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buscarBacktracking } from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { construirProblema } from '../js/nucleo/index.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(`../ejemplos/${ruta}`, import.meta.url)));
const oferta = leer('oferta-ejemplo.json');
let pruebas = 0;

function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

for (const n of [1, 2, 3]) {
  const preferencias = leer(`escenario-${n}-preferencias.json`);
  const esperado = leer(`escenario-${n}-resultado.json`);
  const problema = construirProblema(oferta.materias, preferencias);
  const bt = buscarBacktracking(problema);
  const ex = buscarExhaustiva(problema);

  prueba(`escenario ${n}: top 3 idéntico al ejemplo y a la exhaustiva`, () => {
    assert.deepEqual(bt.opciones, esperado.opciones);
    assert.deepEqual(bt.opciones, ex.opciones);
  });
  prueba(`escenario ${n}: nodos y combinaciones esperados`, () => {
    assert.equal(bt.estadisticas.nodos, esperado.estadisticas.backtracking.nodos);
    assert.equal(bt.estadisticas.combinaciones, esperado.estadisticas.backtracking.combinaciones);
  });
}

prueba('escenario 1: visita menos nodos que la exhaustiva (29 contra 63)', () => {
  const problema = construirProblema(oferta.materias, leer('escenario-1-preferencias.json'));
  const bt = buscarBacktracking(problema).estadisticas;
  const ex = buscarExhaustiva(problema).estadisticas;
  assert.equal(bt.nodos, 29);
  assert.equal(bt.combinaciones, 7);
  assert.ok(bt.nodos < ex.nodos);
});

function crearAzar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function problemaAlAzar(semilla) {
  const azar = crearAzar(semilla);
  const entero = (min, max) => min + Math.floor(azar() * (max - min + 1));
  const turnos = [
    { tipo: 'libre', inicio: 0, fin: 1440 },
    { tipo: 'matutino', inicio: 420, fin: 900 },
    { tipo: 'vespertino', inicio: 900, fin: 1260 },
  ];
  const materias = [];
  for (let m = 0; m < entero(2, 6); m++) {
    const clave = `X${100 + m}`;
    const candidatas = [];
    for (let s = 0; s < entero(1, 5); s++) {
      const dias = [entero(0, 5), entero(0, 5)];
      const inicio = 420 + 30 * entero(0, 26);
      const duracion = 55 + 30 * entero(0, 2);
      const sesiones = [...new Set(dias)].map((dia) => ({ dia, inicio, fin: inicio + duracion }));
      const nrc = String(200000 + m * 10 + s);
      candidatas.push({ clave, nrc, rango: s, seccion: { nrc, sesiones } });
    }
    materias.push({ clave, nombre: clave, candidatas });
  }
  return { turno: turnos[entero(0, 2)], materias, sinOpciones: [] };
}

prueba('300 problemas aleatorios: mismo top 3 que la exhaustiva', () => {
  let conPoda = 0;
  for (let semilla = 1; semilla <= 300; semilla++) {
    const problema = problemaAlAzar(semilla);
    const bt = buscarBacktracking(problema);
    const ex = buscarExhaustiva(problema);
    assert.deepEqual(bt.opciones, ex.opciones, `semilla ${semilla}`);
    assert.ok(bt.estadisticas.nodos <= ex.estadisticas.nodos, `semilla ${semilla}`);
    if (bt.estadisticas.nodos < ex.estadisticas.nodos) conPoda++;
  }
  assert.ok(conPoda > 0, 'la poda nunca se activó');
});

prueba('sin materias: opciones vacías y sinOpciones se conserva', () => {
  const r = buscarBacktracking({ turno: { tipo: 'libre', inicio: 0, fin: 1440 }, materias: [], sinOpciones: ['IL355'] });
  assert.deepEqual(r.opciones, []);
  assert.deepEqual(r.sinOpciones, ['IL355']);
});

console.log(`\n${pruebas} pruebas pasaron`);
