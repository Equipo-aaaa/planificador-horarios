// Pruebas de DI-07 (generar y mostrar las opciones). Se corren con:
//   node tests/pruebas-opciones.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generarOpciones } from '../js/app/generar.js';
import {
  nombreLegible,
  hora,
  duracion,
  describirChoques,
  avisoChoques,
  avisoSinOpciones,
  avisoSinHorario,
} from '../js/app/avisos.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(`../ejemplos/${ruta}`, import.meta.url)));

const oferta = leer('oferta-ejemplo.json');
const nombres = new Map(oferta.materias.map((m) => [m.clave, m.nombre]));
let pruebas = 0;

function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

// --- Generar: el flujo completo da el resultado esperado de cada escenario ---

for (const n of [1, 2, 3]) {
  prueba(`escenario ${n}: Generar da las 3 opciones esperadas`, () => {
    const { resultado } = generarOpciones(oferta.materias, leer(`escenario-${n}-preferencias.json`));
    const esperado = leer(`escenario-${n}-resultado.json`);
    assert.equal(resultado.opciones.length, 3);
    assert.deepEqual(resultado.opciones, esperado.opciones);
    assert.deepEqual(resultado.sinOpciones, esperado.sinOpciones);
  });
}

prueba('una materia con todo descartado va a sinOpciones y no rompe la búsqueda', () => {
  const preferencias = structuredClone(leer('escenario-1-preferencias.json'));
  const bd = preferencias.materias.find((m) => m.clave === 'IL356');
  bd.descartadas = [...bd.orden];
  bd.orden = [];
  const { problema, resultado } = generarOpciones(oferta.materias, preferencias);
  assert.deepEqual(resultado.sinOpciones, ['IL356']);
  assert.equal(problema.materias.length, 3);
  assert.ok(resultado.opciones.every((o) => o.secciones.length === 3));
});

// --- Formato ---

prueba('nombreLegible pasa los nombres de SIIAU a tipo título', () => {
  assert.equal(nombreLegible('ANALISIS DE ALGORITMOS'), 'Analisis de Algoritmos');
  assert.equal(nombreLegible('CALCULO DIFERENCIAL E INTEGRAL'), 'Calculo Diferencial e Integral');
  assert.equal(nombreLegible('PROGRAMACION II'), 'Programacion II');
});

prueba('hora y duracion', () => {
  assert.equal(hora(420), '7:00');
  assert.equal(hora(535), '8:55');
  assert.equal(duracion(250), '4 h 10');
  assert.equal(duracion(120), '2 h');
  assert.equal(duracion(45), '45 min');
  assert.equal(duracion(0), '0 min');
});

// --- Avisos ---

prueba('escenario 3: el aviso dice que Análisis y Bases de Datos chocan (Definition of Done)', () => {
  const { resultado } = generarOpciones(oferta.materias, leer('escenario-3-preferencias.json'));
  assert.equal(
    avisoChoques(resultado.opciones, 0, nombres),
    'No hay horario sin choques: Analisis de Algoritmos y Bases de Datos se empalman lun y mié de 7:00 a 8:55.',
  );
});

prueba('escenario 1: ninguna opción lleva aviso de choques', () => {
  const { resultado } = generarOpciones(oferta.materias, leer('escenario-1-preferencias.json'));
  for (let i = 0; i < 3; i++) assert.equal(avisoChoques(resultado.opciones, i, nombres), null);
});

prueba('si solo la opción 2 choca, el aviso no dice que es inevitable', () => {
  const limpia = { puntaje: { conflictos: 0 }, empalmes: [] };
  const conChoque = {
    puntaje: { conflictos: 2 },
    empalmes: [{ claveA: 'IL355', nrcA: '1', claveB: 'IL357', nrcB: '2', dia: 4, inicio: 600, fin: 660 }],
  };
  assert.equal(
    avisoChoques([limpia, conChoque], 1, nombres),
    'Esta opción tiene choques: Analisis de Algoritmos y Redes de Computadoras se empalman vie de 10:00 a 11:00.',
  );
});

prueba('describirChoques separa tramos distintos y pares distintos', () => {
  const opcion = {
    empalmes: [
      { claveA: 'IL355', claveB: 'IL356', dia: 0, inicio: 420, fin: 535 },
      { claveA: 'IL355', claveB: 'IL356', dia: 3, inicio: 500, fin: 520 },
      { claveA: 'IL357', claveB: 'MT201', dia: 1, inicio: 700, fin: 760 },
    ],
  };
  assert.deepEqual(describirChoques(opcion, nombres), [
    'Analisis de Algoritmos y Bases de Datos se empalman lun de 7:00 a 8:55 y jue de 8:20 a 8:40',
    'Redes de Computadoras y Ecuaciones Diferenciales se empalman mar de 11:40 a 12:40',
  ]);
});

prueba('avisoSinOpciones en singular, plural y vacío', () => {
  assert.equal(avisoSinOpciones([], nombres), null);
  assert.equal(
    avisoSinOpciones(['IL356'], nombres),
    'Bases de Datos se quedó sin secciones y no entra en el horario. Recupera alguna de sus fichas descartadas.',
  );
  assert.match(avisoSinOpciones(['IL356', 'MT201'], nombres), /^Bases de Datos y Ecuaciones Diferenciales se quedaron .* no entran/);
});

prueba('avisoSinHorario: ninguna, algunas o todas las secciones sin horario', () => {
  const { resultado } = generarOpciones(oferta.materias, leer('escenario-1-preferencias.json'));
  const opcion = resultado.opciones[0];
  assert.equal(avisoSinHorario(opcion, oferta.materias), null);

  const algunas = structuredClone(oferta.materias);
  algunas.find((m) => m.clave === 'IL357').secciones.forEach((s) => { s.sesiones = []; });
  assert.equal(avisoSinHorario(opcion, algunas),
    'Sin horario en SIIAU: Redes de Computadoras. No aparece en la cuadrícula ni cuenta para los choques.');

  const todas = structuredClone(oferta.materias);
  todas.forEach((m) => m.secciones.forEach((s) => { s.sesiones = []; }));
  assert.match(avisoSinHorario(opcion, todas), /^Ninguna de estas secciones tiene horario/);
});

console.log(`\n${pruebas} pruebas pasaron`);
