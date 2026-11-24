// Cambios que el estudiante puede hacer sobre las Preferencias de una materia.
function copiarConMateria(preferencias, clave) {
  const nuevas = structuredClone(preferencias);
  const materia = nuevas.materias.find((m) => m.clave === clave);
  if (!materia) throw new Error(`Las preferencias no incluyen la materia ${clave}`);
  return { nuevas, materia };
}

export function descartar(preferencias, clave, nrc) {
  const { nuevas, materia } = copiarConMateria(preferencias, clave);
  if (!materia.orden.includes(nrc)) {
    throw new Error(`La sección ${nrc} no está activa en ${clave}`);
  }
  materia.orden = materia.orden.filter((actual) => actual !== nrc);
  materia.descartadas.push(nrc);
 
  if (materia.fijada === nrc) materia.fijada = null;
  return nuevas;
}

export function recuperar(preferencias, clave, nrc) {
  const { nuevas, materia } = copiarConMateria(preferencias, clave);
  if (!materia.descartadas.includes(nrc)) {
    throw new Error(`La sección ${nrc} no está descartada en ${clave}`);
  }
  materia.descartadas = materia.descartadas.filter((actual) => actual !== nrc);
  materia.orden.push(nrc);
  return nuevas;
}

export function alternarFijada(preferencias, clave, nrc) {
  const { nuevas, materia } = copiarConMateria(preferencias, clave);
  if (materia.descartadas.includes(nrc)) {
    throw new Error("Una ficha descartada no se puede fijar");
  }
  if (!materia.orden.includes(nrc)) {
    throw new Error(`La sección ${nrc} no está en la lista de ${clave}`);
  }
  materia.fijada = materia.fijada === nrc ? null : nrc;
  return nuevas;
}