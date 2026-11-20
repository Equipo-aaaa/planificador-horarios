import { TURNOS } from '../nucleo/index.js';

function crearAzar(semilla) {
  let estado = semilla >>> 0; 
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generarProblemaAleatorio(numMaterias, oferta, semilla) {
  if (!Number.isInteger(numMaterias) || numMaterias < 1) {
    throw new RangeError(`numMaterias debe ser un entero de 1 o más (llegó ${numMaterias})`);
  }
  if (!Number.isInteger(semilla)) {
    throw new TypeError(`la semilla debe ser un entero (llegó ${semilla})`);
  }

  const disponibles = oferta.filter((m) => m.secciones.length > 0);
  if (numMaterias > disponibles.length) {
    throw new RangeError(
      `se pidieron ${numMaterias} materias pero la oferta solo tiene ${disponibles.length}`
    );
  }

  const azar = crearAzar(semilla);
  const barajadas = [...disponibles]; 
  for (let i = 0; i < numMaterias; i++) {
    const j = i + Math.floor(azar() * (barajadas.length - i));
    [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
  }

  const materias = barajadas.slice(0, numMaterias).map((materia) => ({
    clave: materia.clave,
    nombre: materia.nombre,
    candidatas: materia.secciones.map((seccion, rango) => ({
      clave: materia.clave,
      nrc: seccion.nrc,
      rango,
      seccion,
    })),
  }));

  return { turno: { ...TURNOS.matutino }, materias, sinOpciones: [] };
}
