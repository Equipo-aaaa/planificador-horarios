// Armado del problema que recibe el algoritmo y edición manual de una opción.
// Formas en docs/modelo-datos.md ("Problema" y "Opcion"). Módulo puro.
import { crearOpcion } from './puntaje.js';

// Cruza la oferta con las preferencias para que el algoritmo no tenga que buscar
// nada en la oferta: cada candidata ya trae su Seccion completa y su rango.
//
// Reglas (modelo-datos.md, "Problema"):
// 1. Las candidatas son las secciones de `orden`, en ese orden, y su rango es su
//    posición en `orden`.
// 2. Si hay `fijada`, es la única candidata y conserva el rango que tenía.
// 3. Si una materia se queda sin candidatas, no entra y su clave va a `sinOpciones`.
//
// Si un NRC de `orden` ya no viene en la oferta (SIIAU lo quitó), se salta, pero los
// demás conservan su rango: el rango es lo que el estudiante eligió, no un número
// que dependa de lo que haya en la oferta ese día. Si lo que falta es la fijada, la
// materia se va a `sinOpciones`, porque la sección que el estudiante exigió ya no existe.
export function construirProblema(oferta, preferencias) {
  // Índice clave -> Materia, como un dict de Python, para no recorrer la oferta
  // cada vez.
  const materiasPorClave = new Map(oferta.map((m) => [m.clave, m]));

  const materias = [];
  const sinOpciones = [];

  for (const pref of preferencias.materias) {
    const materia = materiasPorClave.get(pref.clave);
    const candidatas = [];

    if (materia) {
      pref.orden.forEach((nrc, rango) => {
        // Regla 2. `return` dentro de forEach salta al siguiente NRC, como `continue`.
        // Se revisa `pref.fijada` sin comparar contra null para tolerar un avance
        // guardado donde el campo falte (undefined).
        if (pref.fijada && nrc !== pref.fijada) return;
        const seccion = materia.secciones.find((s) => s.nrc === nrc);
        if (seccion) candidatas.push({ clave: pref.clave, nrc, rango, seccion });
      });
    }

    if (candidatas.length === 0) {
      sinOpciones.push(pref.clave); // regla 3
    } else {
      materias.push({ clave: pref.clave, nombre: materia.nombre, candidatas });
    }
  }

  // Se copia el turno ({ ...objeto } es como dict.copy()) para que cambiarlo después
  // en las preferencias no altere un problema ya armado.
  return { turno: { ...preferencias.turno }, materias, sinOpciones };
}

// Cambia la sección de una materia en la opción mostrada y la vuelve a evaluar.
// Es lo que usa la edición manual al soltar una ficha en la cuadrícula.
// No modifica `opcion`: devuelve una nueva.
//
// Lanza un error si la materia no está en la opción o si el NRC no es una de sus
// candidatas (por ejemplo, una sección descartada, o cualquier otra cuando la
// materia tiene una fijada). La integración decide qué mostrar en ese caso.
export function editarOpcion(opcion, clave, nrc, problema) {
  if (!opcion.secciones.some((s) => s.clave === clave)) {
    throw new Error(`La materia ${clave} no está en la opción`);
  }

  // La selección se arma en el orden de problema.materias, que es el orden que
  // exige el contrato para opcion.secciones.
  const seleccion = problema.materias.map((materia) => {
    const nrcElegido =
      materia.clave === clave ? nrc : opcion.secciones.find((s) => s.clave === materia.clave)?.nrc;
    const candidata = materia.candidatas.find((c) => c.nrc === nrcElegido);
    if (!candidata) {
      throw new Error(`El NRC ${nrcElegido} no es una candidata de ${materia.clave}`);
    }
    return candidata;
  });

  return crearOpcion(seleccion, problema.turno);
}
