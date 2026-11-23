// La clave es el valor del campo "algoritmo" de las mediciones. En AN-09, la
// estrategia voraz se agrega aquí con una línea más (con la misma clave que use
// la página de análisis en sus mediciones); el resto del módulo no cambia.
const ALGORITMOS = {
  backtracking: { nombre: "Backtracking con poda", color: "#2f6fed", punto: "circle", trazo: [] },
  exhaustiva: { nombre: "Búsqueda exhaustiva", color: "#d9480f", punto: "rectRot", trazo: [6, 4] },
};

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function promediarPorMaterias(mediciones, campo) {
  const grupos = {};
  for (const clave of Object.keys(ALGORITMOS)) grupos[clave] = new Map();

  for (const medicion of mediciones) {
    if (!Object.hasOwn(grupos, medicion.algoritmo)) {
      throw new Error(`Algoritmo desconocido en las mediciones: "${medicion.algoritmo}"`);
    }
    const acumulado = grupos[medicion.algoritmo].get(medicion.materias) ?? { suma: 0, cuantas: 0 };
    acumulado.suma += medicion[campo];
    acumulado.cuantas += 1;
    grupos[medicion.algoritmo].set(medicion.materias, acumulado);
  }

  const series = {};
  for (const [clave, porMaterias] of Object.entries(grupos)) {
    series[clave] = [...porMaterias.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([materias, { suma, cuantas }]) => ({ x: materias, y: suma / cuantas }));
  }
  return series;
}

function formatear(numero) {
  return numero.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

export function montarGrafica(contenedor) {
  if (typeof Chart === "undefined") {
    throw new Error("Falta cargar Chart.js antes de montar la gráfica");
  }

  contenedor.classList.add("grafica");

  const barra = crear("div", "grafica__barra");
  const casilla = crear("input", "form-check-input");
  casilla.type = "checkbox";
  casilla.id = `grafica-log-${Math.random().toString(36).slice(2, 8)}`;
  const etiquetaCasilla = crear("label", "form-check-label", "Escala logarítmica");
  etiquetaCasilla.htmlFor = casilla.id;
  barra.append(casilla, etiquetaCasilla);

  const aviso = crear("p", "grafica__aviso", "Todavía no hay mediciones.");
  const paneles = crear("div", "grafica__paneles");

  function crearPanel(titulo, descripcion) {
    const panel = crear("section", "grafica__panel");
    panel.append(crear("h3", "grafica__titulo", titulo));
    const lienzo = crear("div", "grafica__lienzo");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", descripcion);
    lienzo.append(canvas);
    panel.append(lienzo);
    paneles.append(panel);
    return canvas;
  }

  const canvasTiempo = crearPanel(
    "Tiempo de ejecución",
    "Gráfica de líneas: tiempo en milisegundos contra número de materias, una línea por algoritmo",
  );
  const canvasNodos = crearPanel(
    "Nodos visitados",
    "Gráfica de líneas: nodos visitados contra número de materias, una línea por algoritmo",
  );

  contenedor.replaceChildren(barra, aviso, paneles);

  let graficas = [];
  let ultimas = [];

  function destruir() {
    for (const grafica of graficas) grafica.destroy();
    graficas = [];
  }

  function construir(canvas, series, unidad, logaritmica) {
    const estilo = getComputedStyle(contenedor);
    const texto = estilo.getPropertyValue("--color-texto").trim() || "#1f2933";
    const borde = estilo.getPropertyValue("--color-borde").trim() || "#d5d9e0";

    return new Chart(canvas, {
      type: "line",
      data: {
        datasets: Object.entries(ALGORITMOS).map(([clave, algoritmo]) => ({
          label: algoritmo.nombre,
          data: series[clave],
          borderColor: algoritmo.color,
          backgroundColor: algoritmo.color,
          pointStyle: algoritmo.punto,
          pointRadius: 5,
          borderDash: algoritmo.trazo,
          tension: 0,
          spanGaps: true,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: texto,
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Número de materias" },
            ticks: { stepSize: 1, precision: 0 },
            grid: { color: borde },
          },
          y: {
            type: logaritmica ? "logarithmic" : "linear",
            beginAtZero: !logaritmica,
            title: { display: true, text: unidad },
            grid: { color: borde },
          },
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (contexto) => `${contexto.dataset.label}: ${formatear(contexto.parsed.y)}`,
            },
          },
        },
      },
    });
  }

  function mostrar(mediciones) {
    const hayDatos = mediciones.length > 0;
    if (!hayDatos) {
      destruir();
      ultimas = [];
      barra.hidden = true;
      aviso.hidden = false;
      paneles.hidden = true;
      return;
    }

    const tiempos = promediarPorMaterias(mediciones, "ms");
    const nodos = promediarPorMaterias(mediciones, "nodos");

    destruir();
    ultimas = [...mediciones];
    barra.hidden = false;
    aviso.hidden = true;
    paneles.hidden = false;

    graficas.push(construir(canvasTiempo, tiempos, "Tiempo (ms)", casilla.checked));
    graficas.push(construir(canvasNodos, nodos, "Nodos visitados", casilla.checked));
  }

  casilla.addEventListener("change", () => mostrar(ultimas));

  mostrar([]);

  return { mostrar };
}