// Función de Netlify: GET /api/ciclos
//
// DA-04: lee el formulario de consulta de oferta de SIIAU y devuelve los
// 3 ciclos más recientes que aparecen en su lista desplegable "ciclop",
// con el formato del contrato:
//   { "ciclos": [ { "id": "202620", "nombre": "Calendario 26 B" }, ... ] }

// Página del formulario (la misma que abre un estudiante antes de buscar).
const URL_FORMULARIO = "http://consulta.siiau.udg.mx/wco/sspseca.forma_consulta";

// Igual que en oferta.js: cortamos antes de los 10 s de Netlify
// para responder un 502 claro.
const LIMITE_MS = 8000;

// Cuántos ciclos devolvemos: el anterior, el actual y el próximo.
const CUANTOS = 3;

export default async () => {
  try {
    const respuesta = await fetch(URL_FORMULARIO, { signal: AbortSignal.timeout(LIMITE_MS) });
    if (!respuesta.ok) return responderJson(502, { error: "SIIAU no respondió" });

    // SIIAU responde en Latin-1 (ver oferta.js).
    const html = new TextDecoder("latin1").decode(await respuesta.arrayBuffer());

    const ciclos = leerCiclos(html).slice(0, CUANTOS);

    // Si no encontramos ninguno, SIIAU cambió su página: mejor avisar que
    // devolver una lista vacía que parezca correcta.
    if (ciclos.length === 0) return responderJson(502, { error: "SIIAU cambió de formato" });

    return responderJson(200, { ciclos }, {
      // Los ciclos cambian dos veces al año: guardarlo 1 hora es seguro.
      "Cache-Control": "public, max-age=3600",
    });
  } catch {
    return responderJson(502, { error: "SIIAU no respondió" });
  }
};

// Saca los <option> del <select name="ciclop">.
// Se exporta para poder probarla en Node con un HTML de ejemplo.
export function leerCiclos(html) {
  // 1. Aislamos el <select> de ciclos, para no leer opciones de otras listas
  //    (centros, carreras...). [\s\S]*? = "cualquier cosa, lo menos posible",
  //    como .*? en Python con re.DOTALL.
  const select = html.match(/<select[^>]*name=["']?ciclop["']?[^>]*>([\s\S]*?)<\/select>/i);
  if (!select) return [];

  // 2. Cada opción trae value="202620" y un texto visible.
  const ciclos = [];
  for (const [, id, texto] of select[1].matchAll(/<option[^>]*value=["']?(\d{6})["']?[^>]*>([^<]*)/gi)) {
    // Solo calendarios A (termina en 10) y B (termina en 20). Los de verano
    // (80) desplazarían al ciclo en curso de los 3 que mostramos, y la app
    // es para armar el horario de un semestre normal.
    if (!id.endsWith("10") && !id.endsWith("20")) continue;
    ciclos.push({ id, nombre: limpiarNombre(texto, id) });
  }
  return ciclos;
}

// SIIAU a veces pone el código antes del nombre ("202620 - Calendario 26 B").
// Nos quedamos solo con el nombre; si no hay texto, usamos el código.
function limpiarNombre(texto, id) {
  const limpio = texto.replace(/\s+/g, " ").trim().replace(/^\d{6}\s*[-–]?\s*/, "");
  return limpio || id;
}

function responderJson(estado, cuerpo, encabezados = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", ...encabezados },
  });
}
