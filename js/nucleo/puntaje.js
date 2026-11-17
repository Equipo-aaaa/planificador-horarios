// Puntaje de un horario y comparación entre opciones.
// Reglas en docs/reglas-horario.md, secciones 3 a 6. Módulo puro: no toca la página.
import { empalmesDe, materiasEnConflicto } from './empalmes.js';

// Bajar un lugar en la lista "cuesta" lo mismo que 100 minutos fuera de turno a la
// semana. Si en la prueba con estudiantes el turno pesa demasiado o muy poco, solo
// se cambia este número.
export const PESO_PRIORIDAD = 100;

// Los turnos fijos. El personalizado lo arma el slider del panel de entrada.
// Object.freeze evita que alguien los modifique por accidente, porque se comparten
// entre módulos (en Python sería como usar una tupla en lugar de una lista).
export const TURNOS = Object.freeze({
  libre: Object.freeze({ tipo: 'libre', inicio: 0, fin: 1440 }),
  matutino: Object.freeze({ tipo: 'matutino', inicio: 420, fin: 900 }),
  vespertino: Object.freeze({ tipo: 'vespertino', inicio: 900, fin: 1260 }),
});

// Minutos de una sección que caen antes de que empiece el turno o después de que
// termine. Cada sesión se parte en dos tramos: el que queda antes de turno.inicio
// y el que queda después de turno.fin. Si un tramo no existe, la resta da negativo
// y max(0, ...) lo convierte en 0.
export function minutosFueraDeTurno(seccion, turno) {
  let total = 0;
  for (const s of seccion.sesiones) {
    const antes = Math.max(0, Math.min(s.fin, turno.inicio) - s.inicio);
    const despues = Math.max(0, s.fin - Math.max(s.inicio, turno.fin));
    total += antes + despues;
  }
  return total;
}

// Minutos muertos entre clases del mismo día, sumando toda la semana.
export function minutosDeHuecos(seleccion) {
  // Agrupar las sesiones por día. Un Map funciona como un dict de Python:
  // dia -> lista de sesiones.
  const porDia = new Map();
  for (const candidata of seleccion) {
    for (const sesion of candidata.seccion.sesiones) {
      if (!porDia.has(sesion.dia)) porDia.set(sesion.dia, []);
      porDia.get(sesion.dia).push(sesion);
    }
  }

  let huecos = 0;
  for (const sesiones of porDia.values()) {
    // Se ordena una copia para no alterar el orden de las sesiones de la oferta,
    // del que depende el orden de los empalmes.
    const ordenadas = [...sesiones].sort((a, b) => a.inicio - b.inicio);
    // Se compara contra el fin más tardío visto hasta ahí, no contra el de la sesión
    // anterior: si dos clases se empalman, una puede terminar antes que la otra y
    // eso daría un "hueco" que no existe.
    let finMasTardio = ordenadas[0].fin;
    for (let i = 1; i < ordenadas.length; i++) {
      huecos += Math.max(0, ordenadas[i].inicio - finMasTardio);
      finMasTardio = Math.max(finMasTardio, ordenadas[i].fin);
    }
  }
  return huecos;
}

// Lo que aporta una candidata al costo por su cuenta. Que el costo se pueda sumar
// candidata por candidata es lo que permite calcular la cota optimista (DI-05).
export function costoCandidata(candidata, turno) {
  return PESO_PRIORIDAD * candidata.rango + minutosFueraDeTurno(candidata.seccion, turno);
}

// Puntaje completo de un horario. Menor es mejor en todos los campos.
export function evaluar(seleccion, turno) {
  let prioridad = 0;
  let minutosFuera = 0;
  for (const candidata of seleccion) {
    prioridad += candidata.rango;
    minutosFuera += minutosFueraDeTurno(candidata.seccion, turno);
  }
  return {
    conflictos: materiasEnConflicto(seleccion).length,
    prioridad,
    minutosFuera,
    costo: PESO_PRIORIDAD * prioridad + minutosFuera,
    huecos: minutosDeHuecos(seleccion),
  };
}

// Convierte una selección en una Opcion. Solo guarda clave, NRC y rango de cada
// sección (no la Seccion completa): la vista la busca en la oferta para dibujarla,
// y así la opción pesa poco al guardarla en el navegador.
export function crearOpcion(seleccion, turno) {
  return {
    secciones: seleccion.map(({ clave, nrc, rango }) => ({ clave, nrc, rango })),
    puntaje: evaluar(seleccion, turno),
    empalmes: empalmesDe(seleccion),
  };
}

// Compara texto como lo hacen `<` y `>`, devolviendo -1, 0 o 1.
function compararTexto(x, y) {
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

// Negativo si `a` es mejor, positivo si `b` es mejor, 0 si son la misma opción.
// Sirve directo para sort(): lista.sort(compararOpciones) deja la mejor primero.
// Se compara campo por campo y solo se pasa al siguiente si hay empate.
export function compararOpciones(a, b) {
  const pa = a.puntaje;
  const pb = b.puntaje;
  if (pa.conflictos !== pb.conflictos) return pa.conflictos - pb.conflictos;
  if (pa.costo !== pb.costo) return pa.costo - pb.costo;
  if (pa.huecos !== pb.huecos) return pa.huecos - pb.huecos;

  // Desempate final: obligatorio para que el backtracking y la exhaustiva den el
  // mismo orden aunque encuentren las opciones en distinto orden. Se ordenan las
  // secciones por clave de materia y se comparan los NRC uno por uno, como texto.
  // Se ordenan copias ([...lista], como lista.copy()) para no alterar las opciones.
  const porClave = (x, y) => compararTexto(x.clave, y.clave);
  const sa = [...a.secciones].sort(porClave);
  const sb = [...b.secciones].sort(porClave);
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    const diferencia = compararTexto(sa[i].nrc, sb[i].nrc);
    if (diferencia !== 0) return diferencia;
  }
  return 0;
}
