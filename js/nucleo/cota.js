// Cota optimista y regla de poda del backtracking.
// Reglas en docs/reglas-horario.md, sección 8. Módulo puro: no toca la página.
import { materiasEnConflicto } from './empalmes.js';
import { costoCandidata } from './puntaje.js';

// Lo mejor que podría llegar a ser un horario que empieza con `asignadas`.
//
// La cota nunca promete menos de lo que la rama puede lograr, y por eso podar con
// ella es seguro:
// - Agregar materias no quita choques: los conflictos de las asignadas ya son un
//   piso para el horario completo.
// - Cada materia restante va a costar al menos su candidata más barata.
// Los huecos no entran porque no se pueden acotar: una clase nueva puede rellenar
// un hueco y bajarlos.
export function cotaOptimista(asignadas, restantes, turno) {
  let costo = 0;
  for (const candidata of asignadas) {
    costo += costoCandidata(candidata, turno);
  }
  for (const materia of restantes) {
    // Math.min(...lista) es como min(lista) en Python; el `...` reparte la lista
    // como argumentos separados.
    costo += Math.min(...materia.candidatas.map((c) => costoCandidata(c, turno)));
  }
  return { conflictos: materiasEnConflicto(asignadas).length, costo };
}

// ¿Se abandona la rama? Solo si aun en el mejor caso queda estrictamente peor que
// la tercera opción del top (`peor`). Con empate en conflictos y costo NO se poda,
// porque la rama todavía podría ganar por huecos o por el desempate.
// El backtracking solo debe llamarla cuando el top ya tiene 3 opciones.
export function debePodar(cota, peor) {
  const p = peor.puntaje;
  if (cota.conflictos !== p.conflictos) return cota.conflictos > p.conflictos;
  return cota.costo > p.costo;
}
