// DA-10 · Copiar NRC y exportar imagen
//
// Dos acciones para cuando el estudiante ya tiene su horario:
//   copiarNRC      → texto para pegar en el registro de SIIAU
//   exportarImagen → descarga la cuadrícula como .png
// La página (Diego) pone los botones y llama a estas funciones.

// Copia un NRC por línea, en el orden de las materias de la opción, seguido del
// nombre de la materia. Por ejemplo:
//   100001  ANALISIS DE ALGORITMOS
//   100012  BASES DE DATOS
// Devuelve el texto copiado, para que la página pueda mostrar "Copiado".
export async function copiarNRC(opcion, materias) {
  // Un dict clave → nombre, para no recorrer la lista de materias en cada renglón.
  const nombrePorClave = new Map(materias.map((materia) => [materia.clave, materia.nombre]));

  // opcion.secciones ya viene en el orden de las materias (modelo-datos.md).
  const texto = opcion.secciones
    .map(({ clave, nrc }) => `${nrc}  ${nombrePorClave.get(clave) ?? clave}`)
    .join("\n");

  await escribirPortapapeles(texto);
  return texto;
}

// Descarga el elemento (la cuadrícula) como imagen PNG con html2canvas, que se
// carga por CDN en el HTML y queda como variable global (contrato-modulos.md).
export async function exportarImagen(elemento, nombreArchivo = "horario") {
  if (typeof html2canvas !== "function") {
    throw new Error("Falta cargar html2canvas en la página");
  }

  const canvas = await html2canvas(elemento, {
    // En el celular la cuadrícula es más ancha que la pantalla y tiene scroll.
    // Le pasamos su tamaño completo para que la foto no salga cortada.
    width: elemento.scrollWidth,
    height: elemento.scrollHeight,
    windowWidth: Math.max(document.documentElement.clientWidth, elemento.scrollWidth),
    // Doble resolución: el texto de las fichas es chico y sin esto sale borroso.
    scale: 2,
    // El fondo del tema actual (claro u oscuro); si no, html2canvas lo deja transparente.
    backgroundColor: colorDeFondo(elemento),
  });

  // toBlob usa un callback; lo envolvemos en una Promise para poder usar await.
  const blob = await new Promise((resolver) => canvas.toBlob(resolver, "image/png"));
  if (!blob) throw new Error("No se pudo generar la imagen");

  // Para descargar desde el navegador se crea un enlace temporal y se le da clic.
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith(".png") ? nombreArchivo : `${nombreArchivo}.png`;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Liberamos la memoria de la imagen cuando el navegador ya empezó la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// navigator.clipboard solo existe en páginas seguras (https o localhost), que
// es nuestro caso en Netlify y con Live Server. Si el navegador lo niega
// (permiso, navegador viejo), usamos el método antiguo con un <textarea>.
async function escribirPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const copiado = document.execCommand("copy");
    area.remove();
    if (!copiado) throw new Error("El navegador no dejó copiar al portapapeles");
  }
}

// Busca el primer fondo que no sea transparente, subiendo desde el elemento.
function colorDeFondo(elemento) {
  for (let actual = elemento; actual; actual = actual.parentElement) {
    const color = getComputedStyle(actual).backgroundColor;
    if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color;
  }
  return "#ffffff";
}
