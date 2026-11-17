// Función de Netlify: GET /api/oferta?ciclo=202620&texto=IL358&carrera=INCO
//
// DA-05: consulta la oferta de SIIAU (solo CUCEI), lee la tabla de resultados
// y devuelve una RespuestaOferta con el formato de docs/modelo-datos.md:
//   { ciclo, descargada, fuente: "siiau", materias: [Materia] }

// SIIAU no tiene API: esta es la dirección a la que su formulario hace POST.
const URL_CONSULTA = "http://consulta.siiau.udg.mx/wco/sspseca.consulta_oferta";

// Clave del centro universitario en SIIAU; CUCEI es "D".
const CENTRO_CUCEI = "D";

// Netlify corta las funciones a los 10 s. Cortamos antes para poder
// responder un 502 claro en lugar de un error genérico de Netlify.
const LIMITE_MS = 8500;

// Por si SIIAU parte los resultados en varias páginas: no seguimos más de estas.
const MAX_PAGINAS = 10;

// En el texto de días de SIIAU cada posición es un día: "L M I J V S".
// Un punto significa que ese día no hay clase. Índice = día del contrato (0 = lunes).
const LETRAS_DIAS = ["L", "M", "I", "J", "V", "S"];

export default async (peticion) => {
  const parametros = new URL(peticion.url).searchParams;
  const ciclo = parametros.get("ciclo")?.trim();
  const texto = parametros.get("texto")?.trim();
  const carrera = parametros.get("carrera")?.trim().toUpperCase() ?? "";

  if (!ciclo) return responderJson(400, { error: "Falta el parámetro ciclo" });
  if (!texto) return responderJson(400, { error: "Falta el parámetro texto" });

  // Si parece clave (letras y números, sin espacios, con al menos un número)
  // se busca por clave; si no, por nombre.
  const esClave = /^[A-Za-z0-9]+$/.test(texto) && /\d/.test(texto);

  const formulario = new URLSearchParams({
    ciclop: ciclo,
    cup: CENTRO_CUCEI,
    majrp: carrera,
    crsep: esClave ? texto.toUpperCase() : "",
    // SIIAU solo encuentra nombres que EMPIECEN con el texto. El "%" de
    // adelante significa "cualquier cosa antes", así "bajo nivel" encuentra
    // "PROGRAMACION DE BAJO NIVEL".
    materiap: esClave ? "" : "%" + quitarAcentos(texto).toUpperCase(),
    horaip: "",
    horafp: "",
    edifp: "",
    aulap: "",
    ordenp: "0",
    mostrarp: "500",
  });

  const limite = AbortSignal.timeout(LIMITE_MS);
  try {
    // Pedimos la primera página y, si SIIAU trae un botón de "siguiente",
    // vamos por las demás. Todas las filas se juntan en una sola lista.
    const filas = [];
    let url = URL_CONSULTA;
    let cuerpo = formulario;
    for (let pagina = 0; pagina < MAX_PAGINAS && url; pagina++) {
      const html = await pedirHtml(url, cuerpo, limite);
      filas.push(...leerFilas(html));
      ({ url, cuerpo } = siguientePagina(html) ?? {});
    }

    return responderJson(200, {
      ciclo,
      descargada: new Date().toISOString(),
      fuente: "siiau",
      materias: agruparMaterias(filas),
    }, {
      // La oferta no cambia cada segundo: Netlify guarda la respuesta 1 hora.
      "Cache-Control": "public, max-age=3600",
    });
  } catch {
    return responderJson(502, { error: "SIIAU no respondió" });
  }
};

// Envía el formulario y devuelve el HTML. SIIAU responde en Latin-1,
// no en UTF-8; si lo leyéramos con .text() la Ñ y los acentos saldrían rotos.
async function pedirHtml(url, cuerpo, limite) {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: cuerpo,
    signal: limite,
  });
  if (!respuesta.ok) throw new Error(`SIIAU respondió ${respuesta.status}`);
  return new TextDecoder("latin1").decode(await respuesta.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Lectura del HTML. Se exportan para probarlas en Node con un HTML guardado.
// ---------------------------------------------------------------------------

// Devuelve una "fila" por cada NRC de la tabla:
// { nrc, clave, nombre, seccion, creditos, cupo, disponibles, sesiones, profesor }
export function leerFilas(html) {
  // Cada fila de resultados empieza con una celda "tddatos" que solo tiene
  // el NRC (puros dígitos). Partimos el HTML en esos puntos: cada pedazo
  // es una fila completa, con su tabla de sesiones y la de profesores.
  // Es como re.split() en Python, pero guardando dónde empieza cada pedazo.
  const inicioFila = /<td[^>]*class=["']?tddatos["']?[^>]*>\s*(\d{4,7})\s*<\/td>/gi;
  const cortes = [...html.matchAll(inicioFila)];

  return cortes.map((corte, i) => {
    const fin = i + 1 < cortes.length ? cortes[i + 1].index : html.length;
    return leerFila(corte[1], html.slice(corte.index + corte[0].length, fin));
  });
}

function leerFila(nrc, html) {
  // Las demás celdas "tddatos", en orden: clave, materia, sec, CR, CUP, DIS.
  const celdas = [...html.matchAll(/<td[^>]*class=["']?tddatos["']?[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((m) => textoPlano(m[1]));
  const [clave, nombre, seccion, creditos, cupo, disponibles] = celdas;

  // Tabla de sesiones (class="td1"): una fila por bloque de horario.
  const tablaSesiones = html.match(/<table[^>]*class=["']?td1["']?[^>]*>([\s\S]*?)<\/table>/i)?.[1] ?? "";
  const sesiones = [];
  for (const [, filaSesion] of tablaSesiones.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    // Celdas: ses, hora, días, edificio, aula, periodo.
    const [, hora, dias, edificio, aula] = [...filaSesion.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((m) => textoPlano(m[1]));
    sesiones.push(...convertirSesion(hora, dias, edificio, aula));
  }

  // Profesores: celdas "tdprofesor" alternan número de sesión y nombre.
  // El contrato pide el de la primera sesión, o "" si no hay.
  const profesor = [...html.matchAll(/<td[^>]*class=["']?tdprofesor["']?[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((m) => textoPlano(m[1]))
    .find((t) => t && !/^\d+$/.test(t)) ?? "";

  return {
    nrc,
    clave: clave ?? "",
    nombre: nombre ?? "",
    seccion: seccion ?? "",
    creditos: aEntero(creditos),
    cupo: aEntero(cupo),
    disponibles: aEntero(disponibles),
    sesiones,
    profesor,
  };
}

// "1100-1255" + ". M . J . ." → dos Sesion: martes y jueves de 660 a 775.
// Una fila de SIIAU con varios días se vuelve una sesión por día (contrato).
export function convertirSesion(hora, dias, edificio, aula) {
  const horas = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(hora ?? "");
  // Sin hora (materias en línea, por ejemplo) no hay nada que acomodar.
  if (!horas) return [];
  const [, hi, mi, hf, mf] = horas.map(Number);
  const inicio = hi * 60 + mi;
  const fin = hf * 60 + mf;

  const letras = (dias ?? "").split(/\s+/);
  const sesiones = [];
  LETRAS_DIAS.forEach((letra, dia) => {
    if (letras[dia] === letra) {
      sesiones.push({ dia, inicio, fin, edificio: edificio ?? "", aula: aula ?? "" });
    }
  });
  return sesiones;
}

// Junta las filas en Materia[] con sus Seccion[]. Si un NRC aparece en
// varias filas (por ejemplo teoría y laboratorio), se suman sus sesiones
// a la misma sección. Map funciona como un dict de Python que respeta
// el orden en que se agregan las llaves.
export function agruparMaterias(filas) {
  const materias = new Map();
  const secciones = new Map();

  for (const fila of filas) {
    if (!materias.has(fila.clave)) {
      materias.set(fila.clave, { clave: fila.clave, nombre: fila.nombre, creditos: fila.creditos, secciones: [] });
    }
    const existente = secciones.get(fila.nrc);
    if (existente) {
      existente.sesiones.push(...fila.sesiones);
      if (!existente.profesor) existente.profesor = fila.profesor;
      continue;
    }
    const seccion = {
      nrc: fila.nrc,
      seccion: fila.seccion,
      profesor: fila.profesor,
      cupo: fila.cupo,
      disponibles: fila.disponibles,
      sesiones: [...fila.sesiones],
    };
    secciones.set(fila.nrc, seccion);
    materias.get(fila.clave).secciones.push(seccion);
  }
  return [...materias.values()];
}

// Si SIIAU trae un formulario para ver la siguiente página, devuelve a dónde
// enviarlo y con qué campos; si no, null. El botón "Otra búsqueda" no cuenta.
function siguientePagina(html) {
  for (const [, atributos, contenido] of html.matchAll(/<form([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const boton = contenido.match(/type=["']?submit["']?[^>]*value=["']?([^"'>]*)/i)?.[1] ?? "";
    if (!/siguiente|>/i.test(boton)) continue;

    const accion = atributos.match(/action=["']?([^"'\s>]+)/i)?.[1];
    if (!accion) continue;
    const campos = new URLSearchParams();
    for (const [, input] of contenido.matchAll(/<input([^>]*type=["']?hidden["']?[^>]*)>/gi)) {
      const nombre = input.match(/name=["']?([^"'\s>]+)/i)?.[1];
      const valor = input.match(/value=["']?([^"'>]*)/i)?.[1] ?? "";
      if (nombre) campos.append(nombre, valor);
    }
    // La acción viene relativa ("sspseca.consulta_oferta"): la completamos.
    return { url: new URL(accion, URL_CONSULTA).href, cuerpo: campos };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

// Quita etiquetas HTML, convierte &amp; y &nbsp;, y junta los espacios.
function textoPlano(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function aEntero(texto) {
  const numero = parseInt(texto, 10);
  return Number.isNaN(numero) ? 0 : numero;
}

// SIIAU guarda los nombres en mayúsculas y sin acentos ("ANALISIS").
function quitarAcentos(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function responderJson(estado, cuerpo, encabezados = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", ...encabezados },
  });
}
