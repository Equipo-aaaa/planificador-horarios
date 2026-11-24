// Integración de la página principal (Diego).
//
// Aquí vive el ÚNICO estado de la app: las materias agregadas, las preferencias y
// lo último que se generó. Los módulos visuales solo dibujan y avisan con callbacks
// (contrato-modulos.md, "Integración"); este archivo decide qué hacer con cada aviso.
//
// DI-07 conecta: panel de entrada → listas de prioridad → Generar → pestañas y
// cuadrícula. Al cambiar de ciclo, recarga las materias agregadas para ese ciclo. Quedan para después: guardar el avance (DI-08) y la edición manual,
// copiar NRC y exportar imagen (DI-09).
import { TURNOS } from '../nucleo/index.js';
import { montarPanelEntrada } from '../entrada/panel.js';
import { buscarMaterias } from '../entrada/oferta.js';
import { montarListasPrioridad } from '../vista/listas.js';
import { montarCuadricula } from '../vista/cuadricula.js';
import { textoDescarga } from '../vista/formato.js';
import { montarOpciones } from './opciones.js';
import { generarOpciones } from './generar.js';

// ---------- Estado ----------
// Las formas son las de modelo-datos.md. `generado` guarda con qué materias se
// generó, porque la cuadrícula necesita esa oferta aunque después se quite una
// materia (las opciones a la vista siguen siendo las de antes hasta regenerar).
const estado = {
  materias: [],          // Materia[] de las materias agregadas
  descargada: null,      // fecha ISO de la oferta
  fuente: null,          // "siiau" | "respaldo"
  preferencias: { ciclo: null, turno: { ...TURNOS.matutino }, materias: [] },
  generado: null,        // { problema, resultado, materias } o null
};

// ---------- Módulos ----------

const opciones = montarOpciones(document.getElementById('opciones'), {
  alGenerar: generar,
  alElegir: (opcion) => {
    if (opcion) cuadricula.mostrar(opcion, estado.generado.materias);
    else cuadricula.limpiar();
  },
});

const cuadricula = montarCuadricula(document.getElementById('cuadricula'), {
  // DI-09 conecta aquí la edición manual (editarOpcion del núcleo).
  alEditar: () => {},
});

const listas = montarListasPrioridad(document.getElementById('listas-prioridad'), {
  materias: estado.materias,
  preferencias: estado.preferencias,
  descargada: estado.descargada,
  // Las listas devuelven las Preferencias completas, pero de ellas solo son dueñas
  // del orden, las descartadas y la fijada de cada materia. El ciclo y el turno se
  // toman del estado, por si la copia de las listas ya quedó vieja.
  alCambiar: (nuevas) => {
    estado.preferencias = { ...estado.preferencias, materias: nuevas.materias };
    huboCambios();
  },
});

const panel = montarPanelEntrada(document.getElementById('panel-entrada'), {
  alCambiarCiclo: cambiarCiclo,
  alAgregarMateria: agregarMateria,
  alQuitarMateria: quitarMateria,
  alCambiarTurno: (turno) => {
    estado.preferencias.turno = { ...turno };
    huboCambios();
  },
});

// ---------- Acciones ----------

function agregarMateria(materia, respuesta) {
  if (estado.materias.some((m) => m.clave === materia.clave)) return;
  estado.materias = [...estado.materias, materia];
  estado.preferencias.materias = [...estado.preferencias.materias, preferenciaInicial(materia)];
  if (respuesta) {
    estado.descargada = respuesta.descargada;
    estado.fuente = respuesta.fuente;
    pintarFuente();
  }
  redibujarListas();
  huboCambios();
}

function quitarMateria(clave) {
  estado.materias = estado.materias.filter((m) => m.clave !== clave);
  estado.preferencias.materias = estado.preferencias.materias.filter((p) => p.clave !== clave);
  redibujarListas();
  if (estado.materias.length === 0) {
    // Sin materias no hay nada que mostrar: se vuelve al estado inicial.
    estado.generado = null;
    opciones.limpiar();
    cuadricula.limpiar();
  }
  huboCambios();
}

// Al cambiar de ciclo, las materias agregadas son las del ciclo anterior: sus NRC
// y horarios ya no sirven. Se vuelve a pedir cada una para el ciclo nuevo y se
// conservan las que existan en él, con sus secciones nuevas. El orden de las fichas
// se reinicia porque las NRC son otras. Las opciones generadas se borran porque
// eran del ciclo anterior.
let numeroCambioCiclo = 0;
async function cambiarCiclo(ciclo) {
  const anterior = estado.preferencias.ciclo;
  estado.preferencias.ciclo = ciclo;
  // La primera vez (al cargar la página) o sin materias no hay nada que recargar.
  if (anterior === null || anterior === ciclo || estado.materias.length === 0) return;

  // Si el estudiante cambia de ciclo dos veces seguidas, solo cuenta la última.
  const miNumero = ++numeroCambioCiclo;
  const claves = estado.materias.map((m) => m.clave);
  estado.generado = null;
  opciones.limpiar();
  cuadricula.limpiar();
  opciones.permitirGenerar(false);
  opciones.mostrarAviso(`Cargando tus materias del ciclo nuevo…`);

  // Las búsquedas van en paralelo (Promise.all es como asyncio.gather).
  // allSettled no se detiene si una falla: cada resultado dice si salió bien.
  const respuestas = await Promise.allSettled(claves.map((clave) => buscarMaterias({ ciclo, texto: clave })));
  if (miNumero !== numeroCambioCiclo) return;

  const nuevas = [];
  const faltantes = [];
  respuestas.forEach((r, i) => {
    const materia = r.status === 'fulfilled' ? r.value.materias.find((m) => m.clave === claves[i]) : null;
    if (materia) {
      nuevas.push(materia);
      estado.descargada = r.value.descargada;
      estado.fuente = r.value.fuente;
    } else {
      faltantes.push(claves[i]);
    }
  });

  estado.materias = nuevas;
  estado.preferencias.materias = nuevas.map(preferenciaInicial);
  panel.establecer({ materias: nuevas }); // sin ciclo: el selector ya está en el nuevo
  pintarFuente();
  redibujarListas();
  opciones.mostrarAviso(faltantes.length > 0
    ? `No se encontraron en este ciclo y se quitaron: ${faltantes.join(', ')}.`
    : null);
  huboCambios();
}

// Botón Generar: construirProblema → buscarBacktracking → pestañas y cuadrícula.
function generar() {
  try {
    // Se copia la lista para que quitar una materia después no cambie la oferta
    // con la que se dibujan las opciones ya generadas.
    const materias = [...estado.materias];
    const { problema, resultado } = generarOpciones(materias, estado.preferencias);
    estado.generado = { problema, resultado, materias };
    opciones.mostrar(resultado, materias); // llama a alElegir con la opción 1
  } catch (error) {
    console.error(error);
    opciones.mostrarError(`No se pudieron generar las opciones: ${error.message}`);
  }
}

// ---------- Ayudantes ----------

// Al agregar una materia, todas sus secciones entran en el orden en que llegan,
// sin descartadas ni fijada (modelo-datos.md, "PreferenciaMateria").
function preferenciaInicial(materia) {
  return { clave: materia.clave, orden: materia.secciones.map((s) => s.nrc), descartadas: [], fijada: null };
}

// El contrato pide NO regenerar solo: se avisa que las opciones quedaron viejas.
function huboCambios() {
  opciones.permitirGenerar(estado.materias.length > 0);
  opciones.marcarDesactualizado(estado.generado !== null);
}

// Si las listas no pueden dibujar una materia (por ejemplo, un dato raro de SIIAU),
// el error se muestra en la página y la app sigue: el estado ya se actualizó y
// Generar debe seguir funcionando aunque una lista no se vea.
function redibujarListas() {
  try {
    listas.actualizar(estado.materias, estado.preferencias, estado.descargada);
  } catch (error) {
    console.error(error);
    opciones.mostrarError(`No se pudieron dibujar las listas de prioridad: ${error.message}`);
  }
}

// Indicador de la barra superior: verde si la oferta vino de SIIAU, ámbar si del respaldo.
function pintarFuente() {
  const indicador = document.getElementById('estado-fuente');
  const texto = document.getElementById('estado-fuente-texto');
  indicador.dataset.fuente = estado.fuente ?? '';
  const cuando = textoDescarga(estado.descargada);
  const origen = estado.fuente === 'siiau' ? 'SIIAU' : estado.fuente === 'respaldo' ? 'Respaldo' : 'Ejemplo';
  texto.textContent = cuando ? `${origen} · ${cuando}` : origen;
}

huboCambios();
