
import assert from 'node:assert/strict';
import { buscarBacktracking, SIN_MEJORAS } from '../js/algoritmo/backtracking.js';
import { buscarExhaustiva } from '../js/algoritmo/exhaustiva.js';
import { generarProblemaAleatorio } from '../js/algoritmo/aleatorio.js';
import { compararOpciones, construirProblema, seEmpalman } from '../js/nucleo/index.js';
import {
  crearProblemas,
  leer,
  nodosDeArbol,
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

function seccionesDe(problema, opcion) {
  return opcion.secciones.map((s) => {
    const materia = problema.materias.find((m) => m.clave === s.clave);
    return materia.candidatas.find((c) => c.nrc === s.nrc).seccion;
  });
}

function tieneChoque(problema, opcion) {
  const secciones = seccionesDe(problema, opcion);
  for (let i = 0; i < secciones.length; i++) {
    for (let j = i + 1; j < secciones.length; j++) {
      if (seEmpalman(secciones[i], secciones[j])) return true;
    }
  }
  return false;
}

for (const n of [1, 2, 3]) {
  const preferencias = leer(`../ejemplos/escenario-${n}-preferencias.json`);
  const esperado = leer(`../ejemplos/escenario-${n}-resultado.json`);
  const problema = construirProblema(ofertaEjemplo, preferencias);
  const exhaustiva = buscarExhaustiva(problema);
  const backtracking = buscarBacktracking(problema);
  const backtrackingBase = buscarBacktracking(problema, 3, SIN_MEJORAS);

  prueba(`escenario ${n}: las dos búsquedas dan el top 3 esperado`, () => {
    assert.equal(esperado.opciones.length, 3);
    assert.deepEqual(exhaustiva.opciones, esperado.opciones);
    assert.deepEqual(backtracking.opciones, esperado.opciones);
    assert.deepEqual(backtracking.sinOpciones, esperado.sinOpciones);
  });

  prueba(`escenario ${n}: nodos y combinaciones esperados en cada búsqueda`, () => {
    for (const [nombre, resultado] of [
      ['exhaustiva', exhaustiva],
      ['backtracking', backtrackingBase],
    ]) {
      assert.equal(resultado.estadisticas.nodos, esperado.estadisticas[nombre].nodos, nombre);
      assert.equal(
        resultado.estadisticas.combinaciones,
        esperado.estadisticas[nombre].combinaciones,
        nombre
      );
    }
  });
}

for (const n of [1, 2]) {
  prueba(`escenario ${n}: tiene solución sin choques y ninguna opción tiene empalmes`, () => {
    const problema = construirProblema(
      ofertaEjemplo,
      leer(`../ejemplos/escenario-${n}-preferencias.json`)
    );
    for (const buscar of [buscarExhaustiva, buscarBacktracking]) {
      const todas = buscarExhaustiva(problema, 36).opciones;
      assert.ok(todas.some((o) => o.puntaje.conflictos === 0), 'no existe horario sin choques');

      for (const opcion of buscar(problema).opciones) {
        assert.equal(opcion.puntaje.conflictos, 0);
        assert.deepEqual(opcion.empalmes, []);
        assert.equal(tieneChoque(problema, opcion), false);
      }
    }
  });
}

prueba('escenario 3: no tiene solución sin choques y lo marca con empalmes', () => {
  const problema = construirProblema(ofertaEjemplo, leer('../ejemplos/escenario-3-preferencias.json'));
  const todas = buscarExhaustiva(problema, 100).opciones;
  assert.ok(todas.every((o) => o.puntaje.conflictos > 0), 'sí había una solución sin choques');
  for (const opcion of buscarBacktracking(problema).opciones) {
    assert.ok(opcion.puntaje.conflictos > 0);
    assert.ok(opcion.empalmes.length > 0);
    assert.equal(tieneChoque(problema, opcion), true);
  }
});


const problemas = crearProblemas();

prueba(`hay al menos 200 problemas aleatorios (se prueban ${problemas.length})`, () => {
  assert.ok(problemas.length >= 200);
});

prueba('backtracking y exhaustiva dan exactamente el mismo top 3 en todos', () => {
  for (const { origen, problema } of problemas) {
    const exhaustiva = buscarExhaustiva(problema);
    const backtracking = buscarBacktracking(problema);
    assert.deepEqual(backtracking.opciones, exhaustiva.opciones, origen);
    assert.deepEqual(backtracking.sinOpciones, exhaustiva.sinOpciones, origen);
  }
});

prueba('lo mismo con otros valores de k (1, 2 y 5)', () => {
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

prueba('las estadísticas cumplen las definiciones de reglas-horario.md', () => {
  for (const { origen, problema } of problemas) {
    const ex = buscarExhaustiva(problema).estadisticas;
    const bt = buscarBacktracking(problema).estadisticas;
    assert.equal(ex.combinaciones, totalCombinaciones(problema), origen);
    assert.equal(ex.nodos, nodosDeArbol(problema.materias.map((m) => m.candidatas.length)), origen);
    const base = buscarBacktracking(problema, 3, SIN_MEJORAS).estadisticas;
    assert.ok(base.nodos <= ex.nodos, origen);
    const conteos = problema.materias.map((m) => m.candidatas.length).sort((a, b) => b - a);
    assert.ok(bt.nodos <= nodosDeArbol(conteos), origen);
    assert.ok(bt.combinaciones <= ex.combinaciones, origen);
    assert.ok(bt.ms >= 0 && ex.ms >= 0, origen);
  }
});

prueba('cada resultado viene ordenado, sin repetidos y con a lo mucho k opciones', () => {
  for (const { origen, problema } of problemas) {
    const { opciones } = buscarBacktracking(problema);
    assert.ok(opciones.length >= 1 && opciones.length <= 3, origen);
    for (let i = 1; i < opciones.length; i++) {
      assert.ok(compararOpciones(opciones[i - 1], opciones[i]) < 0, origen);
    }
    const nrcs = opciones.map((o) => o.secciones.map((s) => s.nrc).join(','));
    assert.equal(new Set(nrcs).size, opciones.length, origen);
    for (const o of opciones) assert.equal(o.secciones.length, problema.materias.length, origen);
  }
});

prueba('en todos los problemas, las opciones sin conflictos no tienen empalmes', () => {
  for (const { origen, problema } of problemas) {
    for (const opcion of buscarBacktracking(problema).opciones) {
      const choca = tieneChoque(problema, opcion);
      assert.equal(choca, opcion.puntaje.conflictos > 0, origen);
      assert.equal(choca, opcion.empalmes.length > 0, origen);
    }
  }
});

prueba('los problemas probados son variados: con y sin choques, y con poda', () => {
  let sinChoques = 0;
  let conChoques = 0;
  let conPoda = 0;
  for (const { problema } of problemas) {
    const bt = buscarBacktracking(problema);
    if (bt.opciones[0].puntaje.conflictos === 0) sinChoques++;
    else conChoques++;
    if (bt.estadisticas.nodos < buscarExhaustiva(problema).estadisticas.nodos) conPoda++;
  }
  console.log(`      (sin choques: ${sinChoques}, con choques: ${conChoques}, con poda: ${conPoda})`);
  assert.ok(sinChoques >= 20, `pocos problemas sin choques (${sinChoques})`);
  assert.ok(conChoques >= 20, `pocos problemas con choques (${conChoques})`);
  assert.ok(conPoda >= 50, `la poda se activó pocas veces (${conPoda})`);
});

prueba('materias sin opciones: las dos búsquedas conservan sinOpciones', () => {
  const base = generarProblemaAleatorio(3, ofertaReal, 5);
  const problema = { ...base, sinOpciones: ['IL999'] };
  const ex = buscarExhaustiva(problema);
  const bt = buscarBacktracking(problema);
  assert.deepEqual(bt.sinOpciones, ['IL999']);
  assert.deepEqual(bt.opciones, ex.opciones);
});

console.log(`\n${pruebas} pruebas pasaron`);
