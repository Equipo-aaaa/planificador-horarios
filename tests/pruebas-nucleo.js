// Pruebas del núcleo. Se corren con: node tests/pruebas-nucleo.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  seEmpalman,
  empalmesDe,
  materiasEnConflicto,
  PESO_PRIORIDAD,
  TURNOS,
  minutosFueraDeTurno,
  minutosDeHuecos,
  costoCandidata,
  evaluar,
  crearOpcion,
  compararOpciones,
  cotaOptimista,
  debePodar,
  construirProblema,
  editarOpcion,
} from '../js/nucleo/index.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(`../ejemplos/${ruta}`, import.meta.url)));

const oferta = leer('oferta-ejemplo.json');
let pruebas = 0;

function prueba(nombre, fn) {
  fn();
  pruebas++;
  console.log(`  ok  ${nombre}`);
}

// Arma la selección (Candidata[]) de una opción buscando cada sección en la oferta.
// Mientras construirProblema no exista (DI-05), esto basta para probar el núcleo.
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

// Arma la selección de una combinación de escenario-1-todas.json. El rango sale
// de la posición del NRC en el `orden` de las preferencias del escenario 1.
const preferencias1 = leer('escenario-1-preferencias.json');
function seleccionEscenario1(nrcs) {
  return seleccionDe(
    nrcs.map((nrc, i) => {
      const { clave, orden } = preferencias1.materias[i];
      return { clave, nrc, rango: orden.indexOf(nrc) };
    })
  );
}

// Busca una sección de la oferta de ejemplo por su NRC.
const seccionDeNrc = (nrc) =>
  oferta.materias.flatMap((m) => m.secciones).find((s) => s.nrc === nrc);

console.log('\nPuntaje');

prueba('los turnos fijos tienen las horas del contrato', () => {
  assert.equal(PESO_PRIORIDAD, 100);
  assert.deepEqual(TURNOS.libre, { tipo: 'libre', inicio: 0, fin: 1440 });
  assert.deepEqual(TURNOS.matutino, { tipo: 'matutino', inicio: 420, fin: 900 });
  assert.deepEqual(TURNOS.vespertino, { tipo: 'vespertino', inicio: 900, fin: 1260 });
});

prueba('minutos fuera de turno: 100003 con turno matutino da 230', () => {
  assert.equal(minutosFueraDeTurno(seccionDeNrc('100003'), TURNOS.matutino), 230);
});

prueba('minutos fuera de turno: una sesión de 14:00 a 15:55 deja 55 fuera del matutino', () => {
  assert.equal(minutosFueraDeTurno(seccionSimple(0, 840, 955), TURNOS.matutino), 55);
});

prueba('minutos fuera de turno: una clase de la mañana queda fuera del vespertino', () => {
  // 100001: lunes y miércoles de 7:00 a 8:55, completamente antes de las 15:00.
  assert.equal(minutosFueraDeTurno(seccionDeNrc('100001'), TURNOS.vespertino), 230);
});

prueba('minutos fuera de turno: una sesión que sobra por los dos lados suma ambos tramos', () => {
  const turno = { tipo: 'personalizado', inicio: 540, fin: 600 }; // 9:00 a 10:00
  assert.equal(minutosFueraDeTurno(seccionSimple(0, 420, 655), turno), 120 + 55);
});

prueba('minutos fuera de turno: con turno libre siempre da 0', () => {
  for (const materia of oferta.materias) {
    for (const seccion of materia.secciones) {
      assert.equal(minutosFueraDeTurno(seccion, TURNOS.libre), 0);
    }
  }
});

prueba('huecos: la opción 1 del escenario 1 da 260, como la tabla del contrato', () => {
  const sel = seleccionEscenario1(['100001', '100012', '100021', '100032']);
  assert.equal(minutosDeHuecos(sel), 260);
});

prueba('huecos: sesiones encimadas no cuentan huecos negativos', () => {
  // 7:00-10:55 contiene a 9:00-9:55; luego 11:00-12:55. El único hueco real es de 5 min.
  const sel = [
    { clave: 'A', nrc: '1', rango: 0, seccion: seccionSimple(0, 420, 655) },
    { clave: 'B', nrc: '2', rango: 0, seccion: seccionSimple(0, 540, 595) },
    { clave: 'C', nrc: '3', rango: 0, seccion: seccionSimple(0, 660, 775) },
  ];
  assert.equal(minutosDeHuecos(sel), 5);
});

prueba('huecos: no se cuentan entre días distintos', () => {
  const sel = [
    { clave: 'A', nrc: '1', rango: 0, seccion: seccionSimple(0, 420, 535) },
    { clave: 'B', nrc: '2', rango: 0, seccion: seccionSimple(1, 900, 1015) },
  ];
  assert.equal(minutosDeHuecos(sel), 0);
});

prueba('costo de cada candidata del escenario 1, como la tabla del contrato', () => {
  const esperado = {
    100001: 0, 100002: 100, 100003: 430,
    100011: 0, 100012: 100,
    100021: 0, 100022: 100, 100023: 430,
    100032: 0, 100031: 100,
  };
  for (const { clave, orden } of preferencias1.materias) {
    orden.forEach((nrc, rango) => {
      const candidata = { clave, nrc, rango, seccion: seccionDeNrc(nrc) };
      assert.equal(costoCandidata(candidata, TURNOS.matutino), esperado[nrc], `NRC ${nrc}`);
    });
  }
});

prueba('escenario 1: las 36 combinaciones dan el puntaje del ejemplo', () => {
  for (const c of leer('escenario-1-todas.json')) {
    const puntaje = evaluar(seleccionEscenario1(c.nrcs), TURNOS.matutino);
    const { conflictos, prioridad, minutosFuera, costo, huecos } = c;
    assert.deepEqual(puntaje, { conflictos, prioridad, minutosFuera, costo, huecos }, `NRC ${c.nrcs}`);
  }
});

prueba('escenario 1: ordenar las 36 combinaciones da el mismo lugar que el ejemplo', () => {
  const todas = leer('escenario-1-todas.json');
  // Se desordenan a propósito (al revés) para comprobar que el orden no depende
  // de cómo llegan, que es justo lo que garantiza el desempate.
  const opciones = todas
    .map((c) => ({ lugar: c.lugar, opcion: crearOpcion(seleccionEscenario1(c.nrcs), TURNOS.matutino) }))
    .reverse();
  opciones.sort((x, y) => compararOpciones(x.opcion, y.opcion));
  assert.deepEqual(opciones.map((x) => x.lugar), todas.map((_, i) => i + 1));
});

prueba('escenario 1: los lugares 3 y 4 empatan en todo y los decide el desempate por NRC', () => {
  const todas = leer('escenario-1-todas.json');
  const [tercera, cuarta] = [todas[2], todas[3]].map((c) =>
    crearOpcion(seleccionEscenario1(c.nrcs), TURNOS.matutino)
  );
  assert.deepEqual(
    [tercera.puntaje.conflictos, tercera.puntaje.costo, tercera.puntaje.huecos],
    [cuarta.puntaje.conflictos, cuarta.puntaje.costo, cuarta.puntaje.huecos]
  );
  assert.ok(compararOpciones(tercera, cuarta) < 0);
  assert.ok(compararOpciones(cuarta, tercera) > 0);
});

prueba('una opción comparada consigo misma da 0', () => {
  const opcion = crearOpcion(seleccionEscenario1(['100001', '100012', '100021', '100032']), TURNOS.matutino);
  assert.equal(compararOpciones(opcion, opcion), 0);
});

prueba('un horario sin choques le gana a uno con choques aunque cueste más', () => {
  const sinChoques = crearOpcion(seleccionEscenario1(['100003', '100012', '100023', '100031']), TURNOS.matutino);
  const conChoques = crearOpcion(seleccionEscenario1(['100001', '100011', '100021', '100032']), TURNOS.matutino);
  assert.ok(sinChoques.puntaje.costo > conChoques.puntaje.costo);
  assert.ok(compararOpciones(sinChoques, conChoques) < 0);
});

for (const n of [1, 2, 3]) {
  prueba(`escenario ${n}: crearOpcion reproduce las 3 opciones del ejemplo`, () => {
    const { turno } = leer(`escenario-${n}-preferencias.json`);
    for (const esperada of leer(`escenario-${n}-resultado.json`).opciones) {
      assert.deepEqual(crearOpcion(seleccionDe(esperada.secciones), turno), esperada);
    }
  });
}

console.log('\nCota y poda');

const problema1 = construirProblema(oferta.materias, preferencias1);
const resultado1 = leer('escenario-1-resultado.json');

// Candidata de una materia del problema, por NRC.
const candidataDe = (problema, nrc) =>
  problema.materias.flatMap((m) => m.candidatas).find((c) => c.nrc === nrc);

prueba('escenario 1: la cota al probar 100003 da 430 y la regla indica podar', () => {
  const asignadas = [candidataDe(problema1, '100003')];
  const restantes = problema1.materias.slice(1); // Bases de Datos, Redes, Ecuaciones
  const cota = cotaOptimista(asignadas, restantes, problema1.turno);
  assert.deepEqual(cota, { conflictos: 0, costo: 430 });
  // En ese momento el top 3 tiene costos 100, 200 y 200: el peor es el tercero.
  const peor = resultado1.opciones[2];
  assert.equal(peor.puntaje.costo, 200);
  assert.equal(debePodar(cota, peor), true);
});

prueba('sin nada asignado, la cota es la suma de la candidata más barata de cada materia', () => {
  assert.deepEqual(cotaOptimista([], problema1.materias, problema1.turno), { conflictos: 0, costo: 0 });
});

prueba('la cota cuenta los conflictos que ya hay entre las asignadas', () => {
  const asignadas = [candidataDe(problema1, '100001'), candidataDe(problema1, '100011')];
  const cota = cotaOptimista(asignadas, problema1.materias.slice(2), problema1.turno);
  assert.deepEqual(cota, { conflictos: 2, costo: 0 });
});

// La propiedad que hace segura a la poda: para cada horario a medio armar de las
// 36 combinaciones, la cota nunca promete más de lo que el horario completo logra.
prueba('escenario 1: en todos los prefijos de las 36 combinaciones la cota es optimista', () => {
  for (const c of leer('escenario-1-todas.json')) {
    const seleccion = c.nrcs.map((nrc) => candidataDe(problema1, nrc));
    for (let k = 0; k <= seleccion.length; k++) {
      const cota = cotaOptimista(seleccion.slice(0, k), problema1.materias.slice(k), problema1.turno);
      assert.ok(cota.conflictos <= c.conflictos, `conflictos, NRC ${c.nrcs}, prefijo ${k}`);
      assert.ok(cota.costo <= c.costo, `costo, NRC ${c.nrcs}, prefijo ${k}`);
    }
    // Con todo asignado, la cota es exacta.
    const completa = cotaOptimista(seleccion, [], problema1.turno);
    assert.deepEqual(completa, { conflictos: c.conflictos, costo: c.costo });
  }
});

// Opción falsa con solo el puntaje, que es lo único que mira debePodar.
const conPuntaje = (conflictos, costo) => ({ puntaje: { conflictos, costo, huecos: 0 } });

prueba('con empate en conflictos y costo no se poda (podría ganar por huecos)', () => {
  assert.equal(debePodar({ conflictos: 0, costo: 200 }, conPuntaje(0, 200)), false);
});

prueba('más conflictos que la tercera se poda aunque cueste menos', () => {
  assert.equal(debePodar({ conflictos: 1, costo: 0 }, conPuntaje(0, 900)), true);
});

prueba('menos conflictos que la tercera no se poda aunque cueste más', () => {
  assert.equal(debePodar({ conflictos: 0, costo: 900 }, conPuntaje(2, 0)), false);
});

console.log('\nArmado del problema');

prueba('escenario 1: 4 materias con sus candidatas en el orden de preferencia', () => {
  assert.deepEqual(problema1.turno, TURNOS.matutino);
  assert.deepEqual(problema1.sinOpciones, []);
  assert.deepEqual(
    problema1.materias.map((m) => [m.clave, m.nombre, m.candidatas.map((c) => `${c.nrc}:${c.rango}`)]),
    [
      ['IL355', 'ANALISIS DE ALGORITMOS', ['100001:0', '100002:1', '100003:2']],
      ['IL356', 'BASES DE DATOS', ['100011:0', '100012:1']],
      ['IL357', 'REDES DE COMPUTADORAS', ['100021:0', '100022:1', '100023:2']],
      // El orden lo decide el estudiante, no la oferta: 100032 va primero.
      ['MT201', oferta.materias[3].nombre, ['100032:0', '100031:1']],
    ]
  );
});

prueba('cada candidata trae la sección completa de la oferta', () => {
  for (const materia of problema1.materias) {
    for (const c of materia.candidatas) {
      assert.equal(c.clave, materia.clave);
      assert.equal(c.seccion, seccionDeNrc(c.nrc)); // el mismo objeto, no una copia
    }
  }
});

prueba('escenario 3: la descartada no entra y la fijada es la única candidata', () => {
  const problema3 = construirProblema(oferta.materias, leer('escenario-3-preferencias.json'));
  const candidatas = Object.fromEntries(
    problema3.materias.map((m) => [m.clave, m.candidatas.map((c) => `${c.nrc}:${c.rango}`)])
  );
  assert.deepEqual(candidatas, {
    IL355: ['100001:0'],
    IL356: ['100011:0'],
    IL357: ['100021:0', '100022:1', '100023:2'],
    MT201: ['100032:0', '100031:1'],
  });
  assert.deepEqual(problema3.sinOpciones, []);
});

// Copia de las preferencias del escenario 1 con cambios en una materia.
// structuredClone hace una copia profunda, como copy.deepcopy de Python.
function preferenciasCon(clave, cambios) {
  const pref = structuredClone(preferencias1);
  Object.assign(pref.materias.find((m) => m.clave === clave), cambios);
  return pref;
}

prueba('una fijada que no es la favorita conserva su rango', () => {
  const problema = construirProblema(oferta.materias, preferenciasCon('IL356', { fijada: '100012' }));
  const bases = problema.materias.find((m) => m.clave === 'IL356');
  assert.deepEqual(bases.candidatas.map((c) => [c.nrc, c.rango]), [['100012', 1]]);
});

prueba('una materia con todas sus secciones descartadas va a sinOpciones', () => {
  const pref = preferenciasCon('IL357', { orden: [], descartadas: ['100021', '100022', '100023'] });
  const problema = construirProblema(oferta.materias, pref);
  assert.deepEqual(problema.materias.map((m) => m.clave), ['IL355', 'IL356', 'MT201']);
  assert.deepEqual(problema.sinOpciones, ['IL357']);
});

prueba('un NRC que ya no viene en la oferta se salta y los demás conservan su rango', () => {
  const pref = preferenciasCon('IL355', { orden: ['999999', '100001', '100002'] });
  const problema = construirProblema(oferta.materias, pref);
  assert.deepEqual(problema.materias[0].candidatas.map((c) => [c.nrc, c.rango]), [
    ['100001', 1],
    ['100002', 2],
  ]);
});

prueba('cambiar el turno de las preferencias después no altera el problema armado', () => {
  const pref = structuredClone(preferencias1);
  const problema = construirProblema(oferta.materias, pref);
  pref.turno.inicio = 0;
  assert.equal(problema.turno.inicio, 420);
});

console.log('\nEdición manual');

prueba('cambiar Bases de Datos a 100011 en la opción 1 crea el choque y lo evalúa', () => {
  const original = resultado1.opciones[0];
  const copiaOriginal = structuredClone(original);
  const editada = editarOpcion(original, 'IL356', '100011', problema1);
  assert.deepEqual(editada.secciones.map((s) => s.nrc), ['100001', '100011', '100021', '100032']);
  assert.deepEqual(editada.puntaje, { conflictos: 2, prioridad: 0, minutosFuera: 0, costo: 0, huecos: 250 });
  assert.equal(editada.empalmes.length, 2);
  assert.deepEqual(original, copiaOriginal); // la opción original no cambia
});

prueba('editar y regresar a la sección original da la opción original', () => {
  const original = resultado1.opciones[0];
  const ida = editarOpcion(original, 'IL357', '100023', problema1);
  const vuelta = editarOpcion(ida, 'IL357', '100021', problema1);
  assert.deepEqual(vuelta, original);
});

prueba('un NRC que no es candidata de esa materia lanza un error', () => {
  const original = resultado1.opciones[0];
  assert.throws(() => editarOpcion(original, 'IL356', '100021', problema1), /no es una candidata/);
  assert.throws(() => editarOpcion(original, 'XX000', '100011', problema1), /no está en la opción/);
});

prueba('escenario 3: no se puede cambiar una materia fijada a otra sección', () => {
  const problema3 = construirProblema(oferta.materias, leer('escenario-3-preferencias.json'));
  const opcion = leer('escenario-3-resultado.json').opciones[0];
  assert.throws(() => editarOpcion(opcion, 'IL356', '100012', problema3), /no es una candidata/);
});

console.log(`\n${pruebas} pruebas pasaron`);
