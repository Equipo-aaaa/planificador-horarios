# Respaldo de la oferta

`oferta-<ciclo>.json` es una copia de la oferta de SIIAU con la forma de `RespuestaOferta` y `fuente: "respaldo"` (ver `docs/modelo-datos.md`). Si SIIAU falla o bloquea a Netlify, la página lo usa en lugar de `/api/oferta` y avisa al estudiante.

Solo incluye las materias de **ICOM** en CUCEI, para que el archivo no pese demasiado. Los cupos son los del momento en que se generó (`descargada`).

## Cómo volver a generarlo

Se corre en tu computadora (necesita Node 18 o más nuevo), desde la carpeta del repositorio:

```
node datos/generar-respaldo.js 202620
```

El número es el ciclo (`202620` = Calendario 26 B, `202710` = 27 A). El script muestra cuántos NRC leyó en cada página y los compara con el total que reporta SIIAU; si avisa que faltan registros, no subas el archivo.

Después se sube `datos/oferta-<ciclo>.json` con un PR, como cualquier otro cambio.

Para agregar más carreras, se agregan sus claves a la lista `CARRERAS` del script, por ejemplo `["ICOM", "INCO"]`.
