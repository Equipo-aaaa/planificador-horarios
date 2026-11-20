
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { buscarBacktracking } from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { TURNOS } from '../js/nucleo/index.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url)));

const ejemplo = leer('../ejemplos/oferta-ejemplo.json').materias; 
const real = leer('../datos/oferta-202620.json').materias; 

const ofertas = [
  ['oferta de ejemplo', ejemplo],
  ['respaldo real', real],
];

let pruebas = 0;
function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

for (const [nombre, oferta] of ofertas) {
  const n = Math.min(4, oferta.length);

  prueba(`${nombre}: la misma semilla da el mismo problema`, () => {
    for (let semilla = 0; semilla < 50; semilla++) {
      assert.deepEqual(
        generarProblemaAleatorio(n, oferta, semilla),
        generarProblemaAleatorio(n, oferta, semilla),
        `semilla ${semilla}`
      );
    }
  });
}

prueba('respaldo real: semillas distintas dan problemas distintos', () => {
  const firmas = new Set();
  for (let semilla = 0; semilla < 50; semilla++) {
    const p = generarProblemaAleatorio(4, real, semilla);
    firmas.add(p.materias.map((m) => m.clave).join(','));
  }
  assert.ok(firmas.size > 40, `solo ${firmas.size} problemas distintos en 50 semillas`);
});

prueba('respaldo real: la semilla 42 sigue dando las mismas materias', () => {
  const p = generarProblemaAleatorio(4, real, 42);
  assert.deepEqual(p.materias.map((m) => m.clave), ['IL348', 'IL342', 'IL368', 'IL385']);
});

prueba('el problema de n materias es el de n+1 sin su última materia', () => {
  for (let semilla = 1; semilla <= 20; semilla++) {
    const chico = generarProblemaAleatorio(3, real, semilla).materias.map((m) => m.clave);
    const grande = generarProblemaAleatorio(4, real, semilla).materias.map((m) => m.clave);
    assert.deepEqual(grande.slice(0, 3), chico, `semilla ${semilla}`);
  }
});

for (const [nombre, oferta] of ofertas) {
  prueba(`${nombre}: tiene la forma de un Problema`, () => {
    for (let n = 1; n <= Math.min(6, oferta.length); n++) {
      const p = generarProblemaAleatorio(n, oferta, 7);
      assert.equal(p.materias.length, n);
      assert.deepEqual(p.sinOpciones, []);
      assert.deepEqual(p.turno, TURNOS.matutino);

      const claves = p.materias.map((m) => m.clave);
      assert.equal(new Set(claves).size, n, 'materias repetidas');

      for (const materia of p.materias) {
        const original = oferta.find((m) => m.clave === materia.clave);
        assert.equal(materia.nombre, original.nombre);
        assert.deepEqual(
          materia.candidatas.map((c) => c.nrc),
          original.secciones.map((s) => s.nrc)
        );
        materia.candidatas.forEach((c, i) => {
          assert.equal(c.rango, i);
          assert.equal(c.clave, materia.clave);
          assert.equal(c.seccion, original.secciones[i]);
        });
      }
    }
  });
}

prueba('pedir todas las materias de la oferta de ejemplo las usa todas', () => {
  const p = generarProblemaAleatorio(ejemplo.length, ejemplo, 1);
  assert.deepEqual(p.materias.map((m) => m.clave).sort(), ejemplo.map((m) => m.clave).sort());
});

prueba('no modifica la oferta ni comparte el turno', () => {
  const antes = JSON.stringify(real);
  const p = generarProblemaAleatorio(6, real, 3);
  assert.equal(JSON.stringify(real), antes);
  p.turno.inicio = 0; 
  assert.equal(TURNOS.matutino.inicio, 420);
});

prueba('rechaza entradas inválidas con un error claro', () => {
  assert.throws(() => generarProblemaAleatorio(0, real, 1), RangeError);
  assert.throws(() => generarProblemaAleatorio(2.5, real, 1), RangeError);
  assert.throws(() => generarProblemaAleatorio(real.length + 1, real, 1), RangeError);
  assert.throws(() => generarProblemaAleatorio(5, ejemplo, 1), RangeError);
  assert.throws(() => generarProblemaAleatorio(3, real, 1.5), TypeError);
  assert.throws(() => generarProblemaAleatorio(3, real, undefined), TypeError);
});

prueba('ignora las materias sin secciones', () => {
  const oferta = [...ejemplo, { clave: 'XX000', nombre: 'VACIA', creditos: 8, secciones: [] }];
  assert.throws(() => generarProblemaAleatorio(5, oferta, 1), RangeError);
  const p = generarProblemaAleatorio(4, oferta, 1);
  assert.ok(p.materias.every((m) => m.clave !== 'XX000'));
});

for (const [nombre, oferta] of ofertas) {
  prueba(`${nombre}: las dos búsquedas dan el mismo top 3`, () => {
    for (let semilla = 1; semilla <= 20; semilla++) {
      const p = generarProblemaAleatorio(3, oferta, semilla);
      const bt = buscarBacktracking(p);
      const ex = buscarExhaustiva(p);
      assert.deepEqual(bt.opciones, ex.opciones, `semilla ${semilla}`);
      assert.ok(bt.opciones.length > 0);
    }
  });
}

console.log(`\n${pruebas} pruebas pasaron`);
