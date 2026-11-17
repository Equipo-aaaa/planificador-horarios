// Botón de tema claro / oscuro de la barra superior.
// El tema vive en el atributo data-bs-theme de <html>, el mismo que usa Bootstrap,
// y se guarda aparte del avance ("horarios:tema"), porque es una preferencia de la
// persona y no parte de su horario. El <head> de index.html lo aplica antes de pintar.

const LLAVE = 'horarios:tema';
const raiz = document.documentElement;
const boton = document.getElementById('btn-tema');

function pintarBoton() {
  const oscuro = raiz.dataset.bsTheme === 'dark';
  // El icono muestra a qué tema se cambia, no en cuál se está.
  boton.innerHTML = `<i class="bi bi-${oscuro ? 'sun' : 'moon'}"></i>`;
  boton.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
}

boton.addEventListener('click', () => {
  raiz.dataset.bsTheme = raiz.dataset.bsTheme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(LLAVE, raiz.dataset.bsTheme);
  } catch {
    // Navegación privada o sin espacio: el tema funciona, solo no se recuerda.
  }
  pintarBoton();
});

pintarBoton();
