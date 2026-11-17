// Índice = número de día 
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];


// convierten a texto, justo antes de mostrarlos.
export function minutosAHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

// Junta los días que tienen exactamente el mismo horario para no repetir
// Devuelve una lista de textos, uno por cada horario distinto.
export function resumirSesiones(sesiones) {
  const grupos = new Map();
  for (const sesion of sesiones) {
    const llave = `${sesion.inicio}-${sesion.fin}`;
    if (!grupos.has(llave)) {
      grupos.set(llave, { inicio: sesion.inicio, fin: sesion.fin, dias: [] });
    }
    grupos.get(llave).dias.push(sesion.dia);
  }

  return [...grupos.values()]
    .map((grupo) => ({ ...grupo, dias: [...grupo.dias].sort((a, b) => a - b) }))
    .sort((a, b) => a.dias[0] - b.dias[0] || a.inicio - b.inicio)
    .map((grupo) => {
      const dias = grupo.dias.map((dia) => DIAS[dia]).join(" ");
      return `${dias} ${minutosAHora(grupo.inicio)}–${minutosAHora(grupo.fin)}`;
    });
}

export function textoDescarga(descargadaISO) {
  if (!descargadaISO) return "";
  const fecha = new Date(descargadaISO);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
