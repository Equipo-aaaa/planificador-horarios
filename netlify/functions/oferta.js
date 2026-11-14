// Función de Netlify: GET /api/oferta?ciclo=202620&texto=IL355
//
// DA-03 (primera versión): envía a SIIAU el mismo formulario que llena un
// estudiante en la consulta de oferta y devuelve el HTML de resultados tal cual.
// Sirve para comprobar que SIIAU responde a peticiones que salen de Netlify.
// En DA-05 esta misma función pasa a leer ese HTML y devolver una RespuestaOferta.

// SIIAU no tiene API: esta es la dirección a la que su formulario hace POST.
const URL_CONSULTA = "http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta";

// Clave del centro universitario en SIIAU; CUCEI es "D".
const CENTRO_CUCEI = "D";

// Netlify corta las funciones a los 10 s. Cortamos antes para poder
// responder un 502 claro en lugar de un error genérico de Netlify.
const LIMITE_MS = 8000;

export default async (peticion) => {
  const parametros = new URL(peticion.url).searchParams;
  const ciclo = parametros.get("ciclo");
  const texto = parametros.get("texto");

  if (!ciclo) return responderJson(400, { error: "Falta el parámetro ciclo" });
  if (!texto) return responderJson(400, { error: "Falta el parámetro texto" });

  // Campos del formulario de SIIAU. Por ahora solo buscamos por clave (crsep);
  // la búsqueda por nombre (materiap) y por carrera (majrp) llegan en DA-05.
  // mostrarp es cuántas filas por página: pedimos muchas para no paginar aún.
  const formulario = new URLSearchParams({
    ciclop: ciclo,
    cup: CENTRO_CUCEI,
    majrp: "",
    crsep: texto.trim().toUpperCase(),
    materiap: "",
    horaip: "",
    horafp: "",
    edifp: "",
    aulap: "",
    ordenp: "0",
    mostrarp: "500",
  });

  const inicio = Date.now();
  try {
    const respuesta = await fetch(URL_CONSULTA, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formulario,
      signal: AbortSignal.timeout(LIMITE_MS),
    });
    const ms = Date.now() - inicio;

    // Un 403 o 5xx aquí es la señal de que SIIAU bloquea a Netlify.
    if (!respuesta.ok) {
      return responderJson(502, { error: "SIIAU no respondió", estadoSiiau: respuesta.status, ms });
    }

    // SIIAU responde en Latin-1, no en UTF-8. Si lo leyéramos con
    // respuesta.text() los acentos y la Ñ saldrían como símbolos raros.
    const bytes = await respuesta.arrayBuffer();
    const html = new TextDecoder("latin1").decode(bytes);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Datos de diagnóstico para la prueba; se ven en F12 → Red → Encabezados.
        "X-Siiau-Ms": String(ms),
        "X-Siiau-Bytes": String(bytes.byteLength),
      },
    });
  } catch (error) {
    // TimeoutError = SIIAU tardó más de LIMITE_MS; otro nombre = no se pudo conectar.
    return responderJson(502, { error: "SIIAU no respondió", detalle: error.name, ms: Date.now() - inicio });
  }
};

function responderJson(estado, cuerpo) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
