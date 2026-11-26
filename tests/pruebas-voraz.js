import assert from 'node:assert/strict';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { buscarVoraz } from '../js/algoritmo/voraz.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { compararOpciones, construirProblema, costoCandidata, empalmesDe } from '../js/nucleo/index.js';
import {
  crearProblemas,
  leer,
  ofertaEjemplo,
  ofertaReal,
  totalCombinaciones,
} from './problemas-de-prueba.js';

let pruebas = 0;
function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

const nrcs = (opcion) => opcion.secciones.map((s) => s.nrc);
const escenario = (n) => construirProblema(ofertaEjemplo, leer(`../ejemplos/escenario-${n}-preferencias.json`));

prueba('devuelve un ResultadoBusqueda con una sola opción y sus estadísticas', () => {
  const resultado = buscarVoraz(escenario(1));
  assert.deepEqual(Object.keys(resultado).sort(), ['estadisticas', 'opciones', 'sinOpciones']);
  assert.equal(resultado.opciones.length, 1);
  assert.deepEqual(Object.keys(resultado.estadisticas).sort(), ['combinaciones', 'ms', 'nodos']);
  assert.equal(resultado.estadisticas.combinaciones, 1);
  assert.ok(resultado.estadisticas.ms >= 0);
});

prueba('la opción es una combinación válida: una sección por materia, en el orden del problema', () => {
  for (const { origen, problema } of crearProblemas().slice(0, 150)) {
    const [opcion] = buscarVoraz(problema).opciones;
    assert.deepEqual(opcion.secciones.map((s) => s.clave), problema.materias.map((m) => m.clave), origen);
    opcion.secciones.forEach((s, i) => {
      const candidata = problema.materias[i].candidatas.find((c) => c.nrc === s.nrc);
      assert.ok(candidata, `${origen}: el NRC ${s.nrc} no es candidato de ${s.clave}`);
      assert.equal(s.rango, candidata.rango, origen);
    });
  }
});

prueba('el puntaje y los empalmes son los mismos que la exhaustiva da a esa misma combinación', () => {
  for (const { origen, problema } of crearProblemas().slice(0, 150)) {
    if (totalCombinaciones(problema) > 3000) continue;
    const [opcion] = buscarVoraz(problema).opciones;
    const todas = buscarExhaustiva(problema, totalCombinaciones(problema)).opciones;
    const igual = todas.find((o) => nrcs(o).join() === nrcs(opcion).join());
    assert.deepEqual(opcion, igual, origen);
  }
});

prueba('los nodos son las candidatas que se prueban (a mano: 5, 5 y 4 en los escenarios)', () => {
  assert.equal(buscarVoraz(escenario(1)).estadisticas.nodos, 5);
  assert.equal(buscarVoraz(escenario(2)).estadisticas.nodos, 5);
  assert.equal(buscarVoraz(escenario(3)).estadisticas.nodos, 4);
});

prueba('sin materias: opciones vacías y sinOpciones se conserva', () => {
  const resultado = buscarVoraz({ turno: { tipo: 'libre', inicio: 0, fin: 1440 }, materias: [], sinOpciones: ['IL355'] });
  assert.deepEqual(resultado.opciones, []);
  assert.deepEqual(resultado.sinOpciones, ['IL355']);
  assert.equal(resultado.estadisticas.nodos, 0);
});

function vorazDeReferencia(problema) {
  const seleccion = [];
  for (const materia of problema.materias) {
    const choca = (c) => empalmesDe([...seleccion, c]).some((e) => e.claveB === c.clave);
    const libres = materia.candidatas.filter((c) => !choca(c));
    const elegida =
      libres.length > 0
        ? libres[0]
        : materia.candidatas.reduce((mejor, c) =>
            costoCandidata(c, problema.turno) < costoCandidata(mejor, problema.turno) ? c : mejor
          );
    seleccion.push(elegida);
  }
  return seleccion.map((c) => c.nrc);
}

prueba('elige las mismas secciones que la implementación de referencia en todos los problemas', () => {
  for (const { origen, problema } of crearProblemas()) {
    assert.deepEqual(nrcs(buscarVoraz(problema).opciones[0]), vorazDeReferencia(problema), origen);
  }
  for (const n of [1, 2, 3]) {
    const problema = escenario(n);
    assert.deepEqual(nrcs(buscarVoraz(problema).opciones[0]), vorazDeReferencia(problema), `escenario ${n}`);
  }
});

const candidata = (clave, nrc, rango, sesiones) => ({ clave, nrc, rango, seccion: { nrc, sesiones } });
const lun = (de, a) => [{ dia: 0, inicio: de * 60, fin: a * 60 }];

prueba('si todas las candidatas chocan, elige la de menor COSTO, no la de mejor rango', () => {
  const problema = {
    turno: { tipo: 'personalizado', inicio: 600, fin: 900 },
    sinOpciones: [],
    materias: [
      { clave: 'A', nombre: 'A', candidatas: [candidata('A', 'a1', 0, lun(9, 12))] },
      {
        clave: 'B',
        nombre: 'B',
        candidatas: [
          candidata('B', 'b1', 0, lun(7, 10)),
          candidata('B', 'b2', 1, lun(10, 11)),
          candidata('B', 'b3', 2, lun(11, 12)),
        ],
      },
    ],
  };
  const resultado = buscarVoraz(problema);
  assert.deepEqual(nrcs(resultado.opciones[0]), ['a1', 'b2']);
  assert.equal(resultado.estadisticas.nodos, 4); 
});

prueba('con empate de costo entre las que chocan, se queda la de mejor rango', () => {
  const problema = {
    turno: { tipo: 'personalizado', inicio: 600, fin: 900 },
    sinOpciones: [],
    materias: [
      { clave: 'A', nombre: 'A', candidatas: [candidata('A', 'a1', 0, lun(9, 12))] },
      {
        clave: 'B',
        nombre: 'B',
        candidatas: [
          candidata('B', 'b1', 0, [{ dia: 0, inicio: 500, fin: 620 }]),
          candidata('B', 'b2', 1, lun(10, 11)),
        ],
      },
    ],
  };
  assert.deepEqual(nrcs(buscarVoraz(problema).opciones[0]), ['a1', 'b1']);
});

prueba('elige la de mejor rango que NO choque, aunque otra tenga menos costo', () => {
  const problema = {
    turno: { tipo: 'matutino', inicio: 420, fin: 900 },
    sinOpciones: [],
    materias: [
      { clave: 'A', nombre: 'A', candidatas: [candidata('A', 'a1', 0, lun(8, 10))] },
      {
        clave: 'B',
        nombre: 'B',
        candidatas: [candidata('B', 'b1', 0, lun(14, 17)), candidata('B', 'b2', 1, lun(10, 12))],
      },
    ],
  };
  assert.deepEqual(nrcs(buscarVoraz(problema).opciones[0]), ['a1', 'b1']);
});

const problemas = crearProblemas();
const mejores = problemas.map(({ problema }) => buscarExhaustiva(problema).opciones[0]);

prueba('en los 3 escenarios: da el óptimo en el 1 y el 3, y no en el 2', () => {
  const da = (n) => {
    const problema = escenario(n);
    return compararOpciones(buscarVoraz(problema).opciones[0], buscarExhaustiva(problema).opciones[0]) === 0;
  };
  assert.equal(da(1), true);
  assert.equal(da(2), false);
  assert.equal(da(3), true);
});

prueba('escenario 2 (vespertino): falla porque la voraz no mira el turno', () => {
  const problema = escenario(2);
  const voraz = buscarVoraz(problema).opciones[0];
  const mejor = buscarExhaustiva(problema).opciones[0];
  assert.equal(voraz.puntaje.conflictos, 0);
  assert.equal(voraz.puntaje.minutosFuera, 920);
  assert.equal(voraz.puntaje.costo, 1020);
  assert.equal(mejor.puntaje.costo, 860);
  assert.ok(compararOpciones(voraz, mejor) > 0);
});

prueba(`nunca es mejor que la exhaustiva (${problemas.length} problemas aleatorios)`, () => {
  problemas.forEach(({ origen, problema }, i) => {
    const voraz = buscarVoraz(problema).opciones[0];
    assert.ok(compararOpciones(voraz, mejores[i]) >= 0, `${origen}: la voraz le ganó a la exhaustiva`);
  });
});

prueba('hay al menos 200 problemas y la voraz da el óptimo en algunos pero no en todos', () => {
  assert.ok(problemas.length >= 200);
  let optimo = 0;
  let conMasChoques = 0;
  problemas.forEach(({ problema }, i) => {
    const voraz = buscarVoraz(problema).opciones[0];
    if (compararOpciones(voraz, mejores[i]) === 0) optimo++;
    if (voraz.puntaje.conflictos > mejores[i].puntaje.conflictos) conMasChoques++;
  });
  console.log(`      (da el óptimo en ${optimo} de ${problemas.length} problemas; en ${conMasChoques} deja choques que el óptimo evita)`);
  assert.ok(optimo > 0 && optimo < problemas.length);
  assert.ok(conMasChoques > 0);
});

prueba('caso real: la voraz deja un choque que el óptimo evita, porque no regresa', () => {
  const problema = generarProblemaAleatorio(2, ofertaReal, 1382);
  assert.deepEqual(problema.materias.map((m) => m.clave), ['IL379', 'IL371']);
  assert.equal(totalCombinaciones(problema), 4);

  const voraz = buscarVoraz(problema).opciones[0];
  const mejor = buscarExhaustiva(problema).opciones[0];

  assert.deepEqual(nrcs(voraz), ['213213', '236085']);
  assert.equal(voraz.puntaje.conflictos, 2);

  assert.deepEqual(nrcs(mejor), ['216544', '236085']);
  assert.equal(mejor.puntaje.conflictos, 0);
  assert.equal(mejor.puntaje.prioridad, 1); 
  assert.ok(compararOpciones(voraz, mejor) > 0);
});

prueba('ese mismo caso se resuelve si la materia de una sola sección va primero', () => {
  const problema = generarProblemaAleatorio(2, ofertaReal, 1382);
  const alReves = { ...problema, materias: [...problema.materias].reverse() };
  const voraz = buscarVoraz(alReves).opciones[0];
  assert.equal(voraz.puntaje.conflictos, 0);
  assert.deepEqual(nrcs(voraz).sort(), ['216544', '236085']);
});

console.log(`\n${pruebas} pruebas pasaron`);
