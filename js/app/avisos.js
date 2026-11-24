// Textos que acompañan a las opciones generadas: el resumen del puntaje y los
// avisos de choques y de materias sin secciones. Módulo puro (no toca la página)
// para poder probar los textos en Node: tests/pruebas-opciones.js.

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Palabras que se dejan en minúscula al pasar un nombre de SIIAU a tipo título.
const MENORES = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a', 'al', 'para', 'por', 'con']);

// SIIAU manda los nombres en mayúsculas ("ANALISIS DE ALGORITMOS"); en un aviso
// se leen mejor como "Analisis de Algoritmos". Los números romanos (II, III…) se
// quedan como vienen.
export function nombreLegible(nombre) {
  return nombre
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra, i) => {
      if (/^[ivx]+$/.test(palabra)) return palabra.toUpperCase();
      if (i > 0 && MENORES.has(palabra)) return palabra;
      return palabra[0].toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}

// 535 -> "8:55". Sin cero a la izquierda en la hora, como se dice en voz alta.
export function hora(minutos) {
  return `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}`;
}

// 250 -> "4 h 10", 45 -> "45 min", 120 -> "2 h".
export function duracion(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

// "lun", "lun y mié", "lun, mié y vie".
function listaDias(dias) {
  const nombres = dias.map((d) => DIAS[d]);
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

// "A", "A y B", "A, B y C".
function listaNombres(nombres) {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

// Describe los empalmes de una opción en una frase por cada par de materias que
// chocan, por ejemplo:
//   "Analisis de Algoritmos y Bases de Datos se empalman lun y mié de 7:00 a 8:55"
//
// opcion.empalmes trae un Empalme por día (modelo-datos.md). Para no repetir el
// mismo par de materias, se agrupan por par y, dentro del par, por tramo de
// horas: los días con el mismo tramo se dicen juntos. Es la misma idea que
// resumirSesiones() de la vista, pero sobre empalmes.
//
// `nombres` es un Map clave -> nombre de la materia. Devuelve una lista de frases
// (vacía si la opción no tiene choques).
export function describirChoques(opcion, nombres) {
  // Map de Map, como un dict de dicts en Python:
  //   "IL355|IL356" -> { "420-535" -> { inicio, fin, dias: [0, 2] } }
  const porPar = new Map();
  for (const e of opcion.empalmes) {
    const par = `${e.claveA}|${e.claveB}`;
    if (!porPar.has(par)) porPar.set(par, { claveA: e.claveA, claveB: e.claveB, tramos: new Map() });
    const tramos = porPar.get(par).tramos;
    const llave = `${e.inicio}-${e.fin}`;
    if (!tramos.has(llave)) tramos.set(llave, { inicio: e.inicio, fin: e.fin, dias: [] });
    tramos.get(llave).dias.push(e.dia);
  }

  const nombre = (clave) => nombreLegible(nombres.get(clave) ?? clave);
  return [...porPar.values()].map(({ claveA, claveB, tramos }) => {
    const cuando = [...tramos.values()]
      .map((t) => `${listaDias([...t.dias].sort((a, b) => a - b))} de ${hora(t.inicio)} a ${hora(t.fin)}`)
      .join(' y ');
    return `${nombre(claveA)} y ${nombre(claveB)} se empalman ${cuando}`;
  });
}

// Aviso de choques de la opción mostrada, o null si no tiene.
//
// Las opciones vienen ordenadas primero por materias en conflicto (reglas-horario.md),
// así que si la opción 1 tiene choques es que NO existe ningún horario sin choques.
// En cambio, si solo los tiene la 2 o la 3, sí hay uno sin choques (la opción 1) y
// el aviso lo dice, para que el estudiante no crea que es inevitable.
export function avisoChoques(opciones, indice, nombres) {
  const opcion = opciones[indice];
  if (!opcion || opcion.puntaje.conflictos === 0) return null;
  const inicio = opciones[0].puntaje.conflictos > 0 ? 'No hay horario sin choques' : 'Esta opción tiene choques';
  return `${inicio}: ${describirChoques(opcion, nombres).join('; ')}.`;
}

// Aviso de las materias que se quedaron fuera del problema porque no les queda
// ninguna sección (descartó todas, o su fijada ya no viene en la oferta), o null.
export function avisoSinOpciones(sinOpciones, nombres) {
  if (sinOpciones.length === 0) return null;
  const lista = listaNombres(sinOpciones.map((c) => nombreLegible(nombres.get(c) ?? c)));
  const verbo = sinOpciones.length === 1 ? 'se quedó' : 'se quedaron';
  return `${lista} ${verbo} sin secciones y no ${sinOpciones.length === 1 ? 'entra' : 'entran'} en el horario. ` +
    'Recupera alguna de sus fichas descartadas.';
}

// Aviso de las materias cuya sección elegida no tiene horario en SIIAU (sin
// sesiones), o null. Pasa con los ciclos recién publicados: SIIAU ya lista los NRC
// pero todavía no sus días y horas, así que la cuadrícula no tiene nada que dibujar
// y sin este aviso parecería que Generar no hizo nada.
//
// `materias` es el Materia[] con que se generó, para buscar cada Seccion.
export function avisoSinHorario(opcion, materias) {
  const porClave = new Map(materias.map((m) => [m.clave, m]));
  const sinHorario = opcion.secciones
    .filter(({ clave, nrc }) => {
      const seccion = porClave.get(clave)?.secciones.find((s) => s.nrc === nrc);
      return seccion && seccion.sesiones.length === 0;
    })
    .map(({ clave }) => nombreLegible(porClave.get(clave).nombre));
  if (sinHorario.length === 0) return null;
  if (sinHorario.length === opcion.secciones.length) {
    return 'Ninguna de estas secciones tiene horario en SIIAU todavía, así que no hay nada que dibujar. ' +
      'Si el ciclo es nuevo, SIIAU aún no publica sus horarios: prueba con un ciclo anterior.';
  }
  return `Sin horario en SIIAU: ${listaNombres(sinHorario)}. No aparece en la cuadrícula ni cuenta para los choques.`;
}
