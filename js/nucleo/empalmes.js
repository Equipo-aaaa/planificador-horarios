// Empalmes entre secciones: la base del puntaje, de la cota y de la edición manual.
// Reglas en docs/reglas-horario.md, secciones 1 y 2. Módulo puro: no toca la página,
// para poder probarlo en Node.

// Dos sesiones chocan si son el mismo día y sus horas se cruzan.
// Los `<` son estrictos porque `fin` es excluido: una clase que termina a las 9:00
// no choca con una que empieza a las 9:00.
function sesionesSeEmpalman(a, b) {
  return a.dia === b.dia && a.inicio < b.fin && b.inicio < a.fin;
}

// Dos secciones chocan si alguna sesión de una choca con alguna de la otra.
// `some` se detiene en el primer choque, como un `any()` de Python.
export function seEmpalman(seccionA, seccionB) {
  return seccionA.sesiones.some((sa) =>
    seccionB.sesiones.some((sb) => sesionesSeEmpalman(sa, sb))
  );
}

// Lista cada choque de un horario, con su día y el tramo exacto que se traslapa,
// para que la cuadrícula lo pinte en rojo. Si dos secciones chocan lunes y
// miércoles, son dos empalmes.
//
// El orden importa porque las pruebas comparan contra los ejemplos con deepEqual:
// se recorren los pares (i, j) con i < j en el orden de la selección, y dentro de
// cada par, las sesiones en el orden en que vienen. Así `claveA` siempre es la
// materia que aparece primero en el problema.
export function empalmesDe(seleccion) {
  const empalmes = [];
  for (let i = 0; i < seleccion.length; i++) {
    for (let j = i + 1; j < seleccion.length; j++) {
      const a = seleccion[i];
      const b = seleccion[j];
      for (const sa of a.seccion.sesiones) {
        for (const sb of b.seccion.sesiones) {
          if (!sesionesSeEmpalman(sa, sb)) continue;
          empalmes.push({
            claveA: a.clave,
            nrcA: a.nrc,
            claveB: b.clave,
            nrcB: b.nrc,
            dia: sa.dia,
            // El traslape empieza en el inicio más tardío y termina en el fin más temprano.
            inicio: Math.max(sa.inicio, sb.inicio),
            fin: Math.min(sa.fin, sb.fin),
          });
        }
      }
    }
  }
  return empalmes;
}

// Claves de las materias que chocan con al menos otra, en orden alfabético.
// `conflictos` del puntaje es la longitud de esta lista.
//
// Se usa `seEmpalman` por pares en lugar de `empalmesDe` porque aquí solo importa
// si chocan, no dónde: se evita armar objetos que se tirarían enseguida. Esta
// función se llama en cada horario completo y en cada nodo de la cota, así que
// conviene que sea barata.
export function materiasEnConflicto(seleccion) {
  const enConflicto = new Set(); // como un set() de Python: no repite claves
  for (let i = 0; i < seleccion.length; i++) {
    for (let j = i + 1; j < seleccion.length; j++) {
      if (seEmpalman(seleccion[i].seccion, seleccion[j].seccion)) {
        enConflicto.add(seleccion[i].clave);
        enConflicto.add(seleccion[j].clave);
      }
    }
  }
  // sort() sin comparador ordena como texto, igual que el desempate por NRC.
  return [...enConflicto].sort();
}
