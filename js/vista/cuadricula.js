import { minutosAHora } from "./formato.js";
import { GRUPO_FICHAS } from "./arrastre.js";

const INICIO_DIA = 7 * 60;
const FIN_DIA = 21 * 60;
const TOTAL_MINUTOS = FIN_DIA - INICIO_DIA;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const NUM_COLORES = 8;

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function posicionVertical(inicio, fin) {
  const desde = Math.max(inicio, INICIO_DIA);
  const hasta = Math.min(fin, FIN_DIA);
  return {
    arriba: ((desde - INICIO_DIA) / TOTAL_MINUTOS) * 100,
    alto: (Math.max(hasta - desde, 0) / TOTAL_MINUTOS) * 100,
  };
}

export function repartirCarriles(sesiones) {
  const ordenadas = [...sesiones].sort((a, b) => a.inicio - b.inicio || a.fin - b.fin);
  const resultado = [];
  let grupo = [];
  let finPorCarril = [];

  const cerrarGrupo = () => {
    for (const sesion of grupo) sesion.carriles = finPorCarril.length;
    resultado.push(...grupo);
    grupo = [];
    finPorCarril = [];
  };

  for (const sesion of ordenadas) {
    if (grupo.length > 0 && sesion.inicio >= Math.max(...finPorCarril)) cerrarGrupo();

    let carril = finPorCarril.findIndex((fin) => fin <= sesion.inicio);
    if (carril === -1) carril = finPorCarril.length;
    finPorCarril[carril] = sesion.fin;
    grupo.push({ ...sesion, carril });
  }
  if (grupo.length > 0) cerrarGrupo();
  return resultado;
}

function crearBloque(sesion) {
  const bloque = crear("div", `cuadricula__bloque cuadricula__bloque--c${sesion.color}`);
  bloque.dataset.clave = sesion.clave;
  bloque.dataset.nrc = sesion.nrc;

  const { arriba, alto } = posicionVertical(sesion.inicio, sesion.fin);
  bloque.style.top = `${arriba}%`;
  bloque.style.height = `${alto}%`;
  bloque.style.left = `${(sesion.carril / sesion.carriles) * 100}%`;
  bloque.style.width = `${100 / sesion.carriles}%`;

  const horas = `${minutosAHora(sesion.inicio)}–${minutosAHora(sesion.fin)}`;
  const lugar = [sesion.edificio, sesion.aula].filter(Boolean).join(" ");
  bloque.append(crear("strong", "cuadricula__materia", sesion.nombre));
  bloque.append(crear("span", "cuadricula__detalle", `NRC ${sesion.nrc}`));
  bloque.append(crear("span", "cuadricula__detalle", horas));
  if (lugar) bloque.append(crear("span", "cuadricula__detalle", lugar));

  bloque.title = `${sesion.nombre}, NRC ${sesion.nrc}, ${horas}${lugar ? `, ${lugar}` : ""}`;
  return bloque;
}

function crearEmpalme(empalme) {
  const marca = crear("div", "cuadricula__empalme");
  const { arriba, alto } = posicionVertical(empalme.inicio, empalme.fin);
  marca.style.top = `${arriba}%`;
  marca.style.height = `${alto}%`;
  marca.setAttribute("role", "img");
  marca.setAttribute("aria-label", `Empalme entre ${empalme.claveA} y ${empalme.claveB}`);
  marca.title = `Empalme: ${empalme.claveA} y ${empalme.claveB}, ${minutosAHora(empalme.inicio)}–${minutosAHora(empalme.fin)}`;
  return marca;
}

export function montarCuadricula(contenedor, opciones = {}) {
  const { alEditar } = opciones;

  contenedor.replaceChildren();
  contenedor.classList.add("cuadricula");

  const tabla = crear("div", "cuadricula__tabla");
  tabla.append(crear("div", "cuadricula__esquina"));
  for (const dia of DIAS) tabla.append(crear("div", "cuadricula__dia", dia));

  const horas = crear("div", "cuadricula__horas");
  for (let hora = INICIO_DIA / 60; hora <= FIN_DIA / 60; hora++) {
    const etiqueta = crear("span", "cuadricula__hora", minutosAHora(hora * 60));
    etiqueta.style.top = `${posicionVertical(hora * 60, hora * 60).arriba}%`;
    horas.append(etiqueta);
  }
  tabla.append(horas);

  const columnas = DIAS.map(() => {
    const columna = crear("div", "cuadricula__columna");
    tabla.append(columna);
    return columna;
  });
  contenedor.append(tabla);

  if (alEditar) {
    if (typeof Sortable === "undefined") {
      throw new Error("Falta cargar SortableJS antes de montar la cuadrícula con alEditar");
    }
    Sortable.create(contenedor, {
      group: { name: GRUPO_FICHAS, pull: false, put: true },
      sort: false,
      draggable: ".cuadricula__sin-arrastre",
      onAdd: (evento) => {
        const { clave, nrc } = evento.item.dataset;
        evento.item.remove();
        if (clave && nrc) alEditar(clave, nrc);
      },
    });
  }

  function limpiar() {
    for (const columna of columnas) columna.replaceChildren();
  }

  function mostrar(opcion, materias) {
    limpiar();
    const materiaPorClave = new Map(materias.map((materia) => [materia.clave, materia]));
    const sesionesPorDia = columnas.map(() => []);

    opcion.secciones.forEach((elegida, indice) => {
      const materia = materiaPorClave.get(elegida.clave);
      const seccion = materia?.secciones.find((s) => s.nrc === elegida.nrc);
      if (!seccion) {
        throw new Error(`La oferta no tiene la sección ${elegida.nrc} de ${elegida.clave}`);
      }
      for (const sesion of seccion.sesiones) {
        sesionesPorDia[sesion.dia].push({
          ...sesion,
          clave: elegida.clave,
          nrc: elegida.nrc,
          nombre: materia.nombre,
          color: indice % NUM_COLORES,
        });
      }
    });

    sesionesPorDia.forEach((sesiones, dia) => {
      for (const sesion of repartirCarriles(sesiones)) {
        columnas[dia].append(crearBloque(sesion));
      }
    });

    for (const empalme of opcion.empalmes) {
      columnas[empalme.dia].append(crearEmpalme(empalme));
    }
  }

  return { mostrar, limpiar };
}