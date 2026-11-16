import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { construirProblema, evaluar } from '../js/algoritmo/nucleo-provisional.js';

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
  const resultado = buscarExhaustiva(problema);

  prueba(`escenario ${n}: top 3 idéntico al ejemplo`, () => {
    assert.deepEqual(resultado.opciones, esperado.opciones);
  });
  prueba(`escenario ${n}: nodos y combinaciones esperados`, () => {
    assert.equal(resultado.estadisticas.nodos, esperado.estadisticas.exhaustiva.nodos);
    assert.equal(
      resultado.estadisticas.combinaciones,
      esperado.estadisticas.exhaustiva.combinaciones
    );
    assert.ok(resultado.estadisticas.ms >= 0);
  });
}

prueba('escenario 1: 63 nodos y 36 combinaciones', () => {
  const problema = construirProblema(oferta.materias, leer('escenario-1-preferencias.json'));
  const { estadisticas } = buscarExhaustiva(problema);
  assert.equal(estadisticas.nodos, 63);
  assert.equal(estadisticas.combinaciones, 36);
});

prueba('escenario 1: las 36 combinaciones dan el puntaje del ejemplo', () => {
  const problema = construirProblema(oferta.materias, leer('escenario-1-preferencias.json'));
  const todas = buscarExhaustiva(problema, 36).opciones;
  const esperadas = leer('escenario-1-todas.json');
  assert.equal(todas.length, 36);
  esperadas.forEach((e, i) => {
    assert.deepEqual(todas[i].secciones.map((s) => s.nrc), e.nrcs, `lugar ${e.lugar}`);
    const { conflictos, prioridad, minutosFuera, costo, huecos } = e;
    assert.deepEqual(todas[i].puntaje, { conflictos, prioridad, minutosFuera, costo, huecos });
  });
});

prueba('sin materias: opciones vacías y sinOpciones se conserva', () => {
  const r = buscarExhaustiva({ turno: { tipo: 'libre', inicio: 0, fin: 1440 }, materias: [], sinOpciones: ['IL355'] });
  assert.deepEqual(r.opciones, []);
  assert.deepEqual(r.sinOpciones, ['IL355']);
  assert.equal(r.estadisticas.combinaciones, 0);
});

prueba('k mayor que las combinaciones: devuelve solo las que hay', () => {
  const problema = construirProblema(oferta.materias, leer('escenario-3-preferencias.json'));
  assert.equal(buscarExhaustiva(problema, 100).opciones.length, 6);
});

console.log(`\n${pruebas} pruebas pasaron`);
