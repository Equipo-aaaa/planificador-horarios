export const PESO_PRIORIDAD = 100;

function sesionesSeEmpalman(a, b) {
  return a.dia === b.dia && a.inicio < b.fin && b.inicio < a.fin;
}

export function seEmpalman(seccionA, seccionB) {
  return seccionA.sesiones.some((sa) =>
    seccionB.sesiones.some((sb) => sesionesSeEmpalman(sa, sb))
  );
}

export function empalmesDe(seleccion) {
  const empalmes = [];
  for (let i = 0; i < seleccion.length; i++) {
    for (let j = i + 1; j < seleccion.length; j++) {
      const a = seleccion[i];
      const b = seleccion[j];
      for (const sa of a.seccion.sesiones) {
        for (const sb of b.seccion.sesiones) {
          if (sesionesSeEmpalman(sa, sb)) {
            empalmes.push({
              claveA: a.clave,
              nrcA: a.nrc,
              claveB: b.clave,
              nrcB: b.nrc,
              dia: sa.dia,
              inicio: Math.max(sa.inicio, sb.inicio),
              fin: Math.min(sa.fin, sb.fin),
            });
          }
        }
      }
    }
  }
  return empalmes;
}

export function materiasEnConflicto(seleccion) {
  const claves = new Set();
  for (const e of empalmesDe(seleccion)) {
    claves.add(e.claveA);
    claves.add(e.claveB);
  }
  return [...claves].sort();
}

export function minutosFueraDeTurno(seccion, turno) {
  let total = 0;
  for (const s of seccion.sesiones) {
    total +=
      Math.max(0, Math.min(s.fin, turno.inicio) - s.inicio) +
      Math.max(0, s.fin - Math.max(s.inicio, turno.fin));
  }
  return total;
}

export function minutosDeHuecos(seleccion) {
  const porDia = new Map(); 
  for (const c of seleccion) {
    for (const s of c.seccion.sesiones) {
      if (!porDia.has(s.dia)) porDia.set(s.dia, []);
      porDia.get(s.dia).push(s);
    }
  }
  let huecos = 0;
  for (const sesiones of porDia.values()) {
    sesiones.sort((x, y) => x.inicio - y.inicio);
    let finMasTardio = sesiones[0].fin;
    for (let i = 1; i < sesiones.length; i++) {
      huecos += Math.max(0, sesiones[i].inicio - finMasTardio);
      finMasTardio = Math.max(finMasTardio, sesiones[i].fin);
    }
  }
  return huecos;
}

export function costoCandidata(candidata, turno) {
  return (
    PESO_PRIORIDAD * candidata.rango +
    minutosFueraDeTurno(candidata.seccion, turno)
  );
}

export function evaluar(seleccion, turno) {
  const prioridad = seleccion.reduce((suma, c) => suma + c.rango, 0);
  const minutosFuera = seleccion.reduce(
    (suma, c) => suma + minutosFueraDeTurno(c.seccion, turno),
    0
  );
  return {
    conflictos: materiasEnConflicto(seleccion).length,
    prioridad,
    minutosFuera,
    costo: PESO_PRIORIDAD * prioridad + minutosFuera,
    huecos: minutosDeHuecos(seleccion),
  };
}

export function crearOpcion(seleccion, turno) {
  return {
    secciones: seleccion.map((c) => ({ clave: c.clave, nrc: c.nrc, rango: c.rango })),
    puntaje: evaluar(seleccion, turno),
    empalmes: empalmesDe(seleccion),
  };
}

export function compararOpciones(a, b) {
  const pa = a.puntaje;
  const pb = b.puntaje;
  if (pa.conflictos !== pb.conflictos) return pa.conflictos - pb.conflictos;
  if (pa.costo !== pb.costo) return pa.costo - pb.costo;
  if (pa.huecos !== pb.huecos) return pa.huecos - pb.huecos;

  const porClave = (x, y) => (x.clave < y.clave ? -1 : x.clave > y.clave ? 1 : 0);
  const sa = [...a.secciones].sort(porClave);
  const sb = [...b.secciones].sort(porClave);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i].nrc < sb[i].nrc) return -1;
    if (sa[i].nrc > sb[i].nrc) return 1;
  }
  return 0;
}

export function construirProblema(oferta, preferencias) {
  const materias = [];
  const sinOpciones = [];
  for (const pref of preferencias.materias) {
    const materia = oferta.find((m) => m.clave === pref.clave);
    let candidatas = pref.orden
      .map((nrc, rango) => {
        const seccion = materia.secciones.find((s) => s.nrc === nrc);
        return { clave: pref.clave, nrc, rango, seccion };
      })
      .filter((c) => c.seccion);
    if (pref.fijada) candidatas = candidatas.filter((c) => c.nrc === pref.fijada);
    if (candidatas.length === 0) sinOpciones.push(pref.clave);
    else materias.push({ clave: pref.clave, nombre: materia.nombre, candidatas });
  }
  return { turno: preferencias.turno, materias, sinOpciones };
}
