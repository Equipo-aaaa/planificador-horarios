// DA-07 · Búsqueda de materias con respaldo
//
// Funciones del navegador que piden los ciclos y las materias a las funciones
// de Netlify (/api/ciclos y /api/oferta). Si fallan (SIIAU caído, Netlify
// bloqueado o la página corriendo con Live Server, donde no hay funciones),
// usan el JSON de respaldo de datos/. Así el resto de la página no tiene que
// saber de dónde vienen los datos: solo mira el campo `fuente`.

// Ciclos que tienen archivo de respaldo en datos/. Se escriben a mano porque
// el navegador no puede listar una carpeta del sitio. Al generar un respaldo
// nuevo con datos/generar-respaldo.js, se agrega aquí su ciclo.
const CICLOS_CON_RESPALDO = [
  { id: "202620", nombre: "Calendario 26 B" },
];

// Si la API tarda más que esto, nos rendimos y usamos el respaldo. La función
// de Netlify corta a los 8 s, así que 10 s es suficiente para no cortarla antes.
const LIMITE_MS = 10000;

// Respaldo ya descargado, por ciclo. Es como un dict de Python:
// { "202620": RespuestaOferta }. Así el JSON (unos 160 KB) se baja una sola vez
// aunque el estudiante haga muchas búsquedas.
const respaldosCargados = new Map();

// Devuelve los ciclos para el selector: los de SIIAU o, si falla, los que
// tienen respaldo.
export async function obtenerCiclos() {
  try {
    const datos = await pedirJson("/api/ciclos");
    if (Array.isArray(datos.ciclos) && datos.ciclos.length > 0) return datos.ciclos;
  } catch {
    // Seguimos abajo con el respaldo.
  }
  // Copia de la lista ([...lista] es como lista.copy() en Python) para que
  // nadie modifique la constante por accidente.
  return [...CICLOS_CON_RESPALDO];
}

// Busca materias por clave o por nombre. Devuelve una RespuestaOferta con
// fuente "siiau" si respondió la API, o "respaldo" si se filtró el JSON.
export async function buscarMaterias({ ciclo, texto, carrera = "" }) {
  const parametros = new URLSearchParams({ ciclo, texto });
  if (carrera) parametros.set("carrera", carrera);

  try {
    return await pedirJson(`/api/oferta?${parametros}`);
  } catch (error) {
    // Si el respaldo tampoco existe, buscarEnRespaldo lanza su propio error.
    // Guardamos el de la API para dar más contexto en la consola.
    console.warn("La API de oferta falló, se usa el respaldo:", error.message);
    return buscarEnRespaldo({ ciclo, texto });
  }
}

// Hace la petición y regresa el JSON. Lanza un error si la respuesta no es
// 200 o si no es JSON, para que quien llama pase al respaldo.
async function pedirJson(url) {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(LIMITE_MS) });
  if (!respuesta.ok) throw new Error(`${url} respondió ${respuesta.status}`);
  // Con Live Server, /api/... no existe y a veces responde una página HTML de
  // error con estado 200; .json() falla y también caemos al respaldo.
  return respuesta.json();
}

// Filtra el respaldo con las mismas reglas que la función de Netlify:
// si el texto parece clave, por clave exacta; si no, por nombre que contenga
// el texto (sin acentos y en mayúsculas, como guarda SIIAU los nombres).
//
// El filtro por carrera no se aplica: el respaldo no guarda de qué carrera es
// cada materia, solo trae las de las carreras del equipo (ver datos/LEEME.md).
async function buscarEnRespaldo({ ciclo, texto }) {
  const respaldo = await cargarRespaldo(ciclo);
  const buscado = normalizar(texto);
  const esClave = /^[A-Z0-9]+$/.test(buscado) && /\d/.test(buscado);

  const materias = respaldo.materias.filter((materia) =>
    esClave ? materia.clave === buscado : normalizar(materia.nombre).includes(buscado),
  );

  // { ...respaldo, materias } copia el objeto y cambia solo "materias",
  // como {**respaldo, "materias": materias} en Python.
  return { ...respaldo, fuente: "respaldo", materias };
}

async function cargarRespaldo(ciclo) {
  if (respaldosCargados.has(ciclo)) return respaldosCargados.get(ciclo);

  // La ruta se arma a partir de este archivo (js/entrada/oferta.js) y no de la
  // página, para que funcione igual desde index.html que desde demos/.
  const url = new URL(`../../datos/oferta-${ciclo}.json`, import.meta.url);
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`No hay datos para el ciclo ${ciclo}: SIIAU no respondió y no existe respaldo`);

  const respaldo = await respuesta.json();
  respaldosCargados.set(ciclo, respaldo);
  return respaldo;
}

// "Análisis " → "ANALISIS". Igual que quitarAcentos de netlify/functions/oferta.js.
function normalizar(texto) {
  return texto.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}
