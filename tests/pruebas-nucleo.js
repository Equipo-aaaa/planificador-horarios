// Pruebas del núcleo. Se corren con: node tests/pruebas-nucleo.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seEmpalman, empalmesDe, materiasEnConflicto } from '../js/nucleo/empalmes.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(`../ejemplos/${ruta}`, import.meta.url)));

const oferta = leer('oferta-ejemplo.json');
let pruebas = 0;

function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

// Arma la selección (Candidata[]) de una opción buscando cada sección en la oferta.
// Mientras construirProblema no exista (DI-05), esto basta para probar los empalmes.
function seleccionDe(secciones) {
  return secciones.map(({ clave, nrc, rango }) => {
    const materia = oferta.materias.find((m) => m.clave === clave);
    const seccion = materia.secciones.find((s) => s.nrc === nrc);
    return { clave, nrc, rango, seccion };
  });
}

// Sección de una sola sesión, para los casos de borde.
const seccionSimple = (dia, inicio, fin) => ({ sesiones: [{ dia, inicio, fin }] });

console.log('Empalmes');

// Los bloques de CUCEI son de 7:00 a 8:55, de 9:00 a 10:55, de 11:00 a 12:55...
// En minutos: 420-535, 540-655, 660-775.
const B1 = [420, 535]; // 7:00 a 8:55
const B2 = [540, 655]; // 9:00 a 10:55

prueba('bloques consecutivos (7:00-8:55 y 9:00-10:55) no chocan', () => {
  assert.equal(seEmpalman(seccionSimple(0, ...B1), seccionSimple(0, ...B2)), false);
});

// No pasa con los bloques normales, pero la regla del contrato lo pide explícitamente:
// como `fin` es excluido, terminar justo cuando la otra empieza no es empalme.
prueba('una clase que termina a las 9:00 no choca con una que empieza a las 9:00', () => {
  assert.equal(seEmpalman(seccionSimple(0, 420, 540), seccionSimple(0, ...B2)), false);
  assert.equal(seEmpalman(seccionSimple(0, ...B2), seccionSimple(0, 420, 540)), false);
});

prueba('el mismo bloque en días distintos no es empalme', () => {
  assert.equal(seEmpalman(seccionSimple(0, ...B1), seccionSimple(1, ...B1)), false);
});

// Un laboratorio de 3 horas (7:00 a 9:55) invade el bloque de las 9:00.
prueba('un bloque largo que invade el siguiente da el tramo exacto del traslape', () => {
  const sel = [
    { clave: 'A', nrc: '1', rango: 0, seccion: seccionSimple(0, 420, 595) },
    { clave: 'B', nrc: '2', rango: 0, seccion: seccionSimple(0, ...B2) },
  ];
  assert.deepEqual(empalmesDe(sel), [
    { claveA: 'A', nrcA: '1', claveB: 'B', nrcB: '2', dia: 0, inicio: 540, fin: 595 },
  ]);
});

// Un bloque de 7:00 a 10:55 contiene completo al de 9:00 a 10:55.
prueba('una clase dentro de otra da el tramo de la de adentro', () => {
  const sel = [
    { clave: 'A', nrc: '1', rango: 0, seccion: seccionSimple(0, 420, 655) },
    { clave: 'B', nrc: '2', rango: 0, seccion: seccionSimple(0, ...B2) },
  ];
  assert.deepEqual(empalmesDe(sel), [
    { claveA: 'A', nrcA: '1', claveB: 'B', nrcB: '2', dia: 0, inicio: 540, fin: 655 },
  ]);
});

prueba('tres materias en el mismo bloque cuentan 3, en orden alfabético', () => {
  const sel = [
    { clave: 'C', nrc: '3', rango: 0, seccion: seccionSimple(0, ...B1) },
    { clave: 'A', nrc: '1', rango: 0, seccion: seccionSimple(0, ...B1) },
    { clave: 'B', nrc: '2', rango: 0, seccion: seccionSimple(0, ...B1) },
  ];
  assert.deepEqual(materiasEnConflicto(sel), ['A', 'B', 'C']);
});

prueba('escenario 3: Análisis y Bases de Datos dan 2 empalmes y 2 materias en conflicto', () => {
  const sel = seleccionDe(leer('escenario-3-resultado.json').opciones[0].secciones);
  const empalmes = empalmesDe(sel);
  assert.equal(empalmes.length, 2);
  assert.deepEqual(empalmes.map((e) => e.dia), [0, 2]); // lunes y miércoles
  assert.deepEqual(materiasEnConflicto(sel), ['IL355', 'IL356']);
});

// Cada opción esperada de los tres escenarios trae sus empalmes y su número de
// conflictos; tienen que salir idénticos, incluido el orden de los empalmes.
for (const n of [1, 2, 3]) {
  prueba(`escenario ${n}: empalmes y conflictos de las 3 opciones iguales al ejemplo`, () => {
    for (const opcion of leer(`escenario-${n}-resultado.json`).opciones) {
      const sel = seleccionDe(opcion.secciones);
      assert.deepEqual(empalmesDe(sel), opcion.empalmes);
      assert.equal(materiasEnConflicto(sel).length, opcion.puntaje.conflictos);
    }
  });
}

prueba('escenario 1: los conflictos de las 36 combinaciones coinciden con el ejemplo', () => {
  const claves = oferta.materias.map((m) => m.clave);
  for (const combinacion of leer('escenario-1-todas.json')) {
    const sel = seleccionDe(combinacion.nrcs.map((nrc, i) => ({ clave: claves[i], nrc, rango: 0 })));
    assert.equal(materiasEnConflicto(sel).length, combinacion.conflictos, `NRC ${combinacion.nrcs}`);
  }
});

console.log(`\n${pruebas} pruebas pasaron`);
