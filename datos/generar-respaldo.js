// Script para generar el respaldo de la oferta (DA-06).
//
// Se corre en tu computadora, NO en Netlify:
//   node datos/generar-respaldo.js 202620
//
// Descarga de SIIAU toda la oferta de las carreras del equipo para ese ciclo
// y la guarda en datos/oferta-<ciclo>.json con la forma de RespuestaOferta
// y fuente "respaldo". Si SIIAU se cae o bloquea a Netlify, la página usa
// este archivo (DA-07).
//
// Reutiliza la lectura del HTML de la función de oferta, para que el respaldo
// salga exactamente igual que una respuesta en vivo.

import { writeFile } from "node:fs/promises";
import { URL_CONSULTA, pedirHtml, leerFilas, agruparMaterias, siguientePagina } from "../netlify/functions/oferta.js";

// Carreras del equipo. Basta con estas para que el archivo no pese demasiado.
const CARRERAS = ["ICOM"];

const CENTRO_CUCEI = "D";

// Aquí no hay límite de 10 s como en Netlify: le damos 2 minutos por carrera.
const LIMITE_MS = 120000;
const MAX_PAGINAS = 50;

const ciclo = process.argv[2];
if (!/^\d{6}$/.test(ciclo ?? "")) {
  console.error("Uso: node datos/generar-respaldo.js <ciclo>   (por ejemplo 202620)");
  process.exit(1);
}

const filas = [];
for (const carrera of CARRERAS) {
  console.log(`Descargando ${carrera} del ciclo ${ciclo}...`);
  const leidas = await descargarCarrera(carrera);
  console.log(`  ${leidas.filas.length} NRC leídos (SIIAU dice ${leidas.total ?? "?"} registros)`);
  if (leidas.total !== null && leidas.filas.length < leidas.total) {
    // Si esto sale, SIIAU partió los resultados y no se leyeron todas las páginas.
    console.warn("  ⚠ Faltan registros: revisa la paginación antes de subir el archivo.");
  }
  filas.push(...leidas.filas);
}

const respuesta = {
  ciclo,
  descargada: new Date().toISOString(),
  fuente: "respaldo",
  materias: agruparMaterias(filas),
};

const ruta = new URL(`./oferta-${ciclo}.json`, import.meta.url);
// Sin sangría para que pese menos; el navegador lo lee igual.
await writeFile(ruta, JSON.stringify(respuesta));

const secciones = respuesta.materias.reduce((suma, m) => suma + m.secciones.length, 0);
console.log(`Listo: ${respuesta.materias.length} materias y ${secciones} secciones en datos/oferta-${ciclo}.json`);

// Pide todas las páginas de una carrera, sin filtrar por materia.
async function descargarCarrera(carrera) {
  let url = URL_CONSULTA;
  let cuerpo = new URLSearchParams({
    ciclop: ciclo, cup: CENTRO_CUCEI, majrp: carrera, crsep: "", materiap: "",
    horaip: "", horafp: "", edifp: "", aulap: "", ordenp: "0", mostrarp: "500",
  });
  const limite = AbortSignal.timeout(LIMITE_MS);
  const leidas = [];
  let total = null;

  const vistos = new Set();
  for (let pagina = 0; pagina < MAX_PAGINAS && url; pagina++) {
    const html = await pedirHtml(url, cuerpo, limite);
    const nuevas = leerFilas(html).filter((f) => !vistos.has(f.nrc));
    console.log(`  página ${pagina + 1}: ${nuevas.length} NRC nuevos`);
    // Si una página ya no trae NRC nuevos, SIIAU nos está repitiendo: paramos.
    if (pagina > 0 && nuevas.length === 0) break;
    nuevas.forEach((f) => vistos.add(f.nrc));
    leidas.push(...nuevas);
    // SIIAU escribe "Total de registros: N" en la última página; sirve para comprobar.
    const totalPagina = html.match(/Total de registros:\s*(\d+)/i)?.[1];
    if (totalPagina) total = Number(totalPagina);
    ({ url, cuerpo } = siguientePagina(html) ?? {});
  }
  return { filas: leidas, total };
}
