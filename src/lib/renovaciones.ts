import type { ClubSponsor } from "@/lib/types";

/**
 * Renovaciones de patrocinadores (migración 0050).
 *
 * El patrocinio del deporte base se pierde casi siempre igual: no
 * porque la empresa diga que no, sino porque nadie volvió a preguntar y
 * la temporada empezó sin hablarlo. Esto es lo que convierte una fecha
 * guardada en un aviso a tiempo.
 *
 * Todo lo de aquí son funciones puras sobre fechas, sin base de datos,
 * y por eso se pueden probar de verdad. Las cuentas con fechas son
 * justo donde se cuelan los errores que nadie ve: el día de hoy contado
 * como "faltan -1 días", el cambio de hora que mueve un día entero, el
 * mes que se pasa de largo.
 */

export type EstadoRenovacion = "sin-fecha" | "pasada" | "urgente" | "proxima" | "al-dia";

/** A partir de aquí se considera que corre prisa. */
export const DIAS_URGENTE = 30;
/** A partir de aquí ya conviene tenerlo a la vista. */
export const DIAS_PROXIMA = 90;

/**
 * Los días que faltan entre dos fechas, contando solo el día.
 *
 * Se comparan a mediodía UTC y no a medianoche: en España, una fecha
 * guardada como "2026-03-29" convertida a medianoche local cae dentro
 * del cambio de hora, y la resta se queda en 23 o 25 horas. Dividiendo
 * eso entre 24 h, un día entero aparece y desaparece según el mes. A
 * mediodía quedan doce horas de margen por cada lado y eso no pasa.
 */
export function diasHasta(fechaISO: string, hoy: Date): number {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return Number.NaN;

  const destino = Date.UTC(anio, mes - 1, dia, 12);
  const origen = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);

  return Math.round((destino - origen) / 86_400_000);
}

export function estadoDeRenovacion(
  patrocinador: Pick<ClubSponsor, "renewalDate">,
  hoy: Date,
): EstadoRenovacion {
  if (!patrocinador.renewalDate) return "sin-fecha";

  const dias = diasHasta(patrocinador.renewalDate, hoy);
  if (Number.isNaN(dias)) return "sin-fecha";

  // El propio día cuenta como "hoy toca", no como pasada: quien abre el
  // panel esa mañana todavía está a tiempo.
  if (dias < 0) return "pasada";
  if (dias <= DIAS_URGENTE) return "urgente";
  if (dias <= DIAS_PROXIMA) return "proxima";
  return "al-dia";
}

/** Los estados que piden hacer algo, en el orden en que se enseñan. */
export const ESTADOS_QUE_AVISAN: EstadoRenovacion[] = ["pasada", "urgente"];

/**
 * Cuántas renovaciones piden atención.
 *
 * Es el número del contador rojo del menú. Solo cuenta las que ya han
 * pasado o están dentro de los 30 días: si contara también las de
 * dentro de tres meses, el contador estaría encendido todo el año y
 * dejaría de significar nada.
 */
export function contarRenovacionesQueAvisan(patrocinadores: ClubSponsor[], hoy: Date): number {
  return patrocinadores.filter((patrocinador) =>
    ESTADOS_QUE_AVISAN.includes(estadoDeRenovacion(patrocinador, hoy)),
  ).length;
}

const ORDEN: Record<EstadoRenovacion, number> = {
  pasada: 0,
  urgente: 1,
  proxima: 2,
  "al-dia": 3,
  "sin-fecha": 4,
};

/**
 * Los patrocinadores ordenados por lo que hay que hacer antes.
 *
 * Primero lo vencido, después lo urgente, y al final los que no tienen
 * fecha: esos no son un problema para hoy, pero sí la lista de lo que
 * falta por rellenar, y por eso no se esconden.
 */
export function ordenarPorRenovacion(patrocinadores: ClubSponsor[], hoy: Date): ClubSponsor[] {
  return [...patrocinadores].sort((uno, otro) => {
    const porEstado =
      ORDEN[estadoDeRenovacion(uno, hoy)] - ORDEN[estadoDeRenovacion(otro, hoy)];
    if (porEstado !== 0) return porEstado;

    // Dentro del mismo estado, lo más cercano primero.
    if (uno.renewalDate && otro.renewalDate) {
      return uno.renewalDate.localeCompare(otro.renewalDate);
    }
    return uno.name.localeCompare(otro.name, "es");
  });
}

/** "Faltan 12 días", "Era hace 3 días", "Hoy". */
export function cuantoFalta(fechaISO: string, hoy: Date): string {
  const dias = diasHasta(fechaISO, hoy);
  if (Number.isNaN(dias)) return "";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Se pasó ayer";
  if (dias < 0) return `Se pasó hace ${Math.abs(dias)} días`;
  if (dias < 45) return `Faltan ${dias} días`;

  const meses = Math.round(dias / 30);
  return meses === 1 ? "Falta un mes" : `Faltan unos ${meses} meses`;
}

/**
 * El mensaje de renovación, listo para copiar.
 *
 * Esto no es un adorno: "qué escribir" era parte de lo que faltaba. Un
 * club que lleva meses sin hablar con una empresa no escribe porque no
 * sabe cómo empezar, y el correo que acaba saliendo es "¿seguís
 * interesados?", que es la peor forma de preguntarlo porque invita a
 * contestar que no.
 *
 * El texto hace tres cosas, en este orden: recuerda lo que la empresa
 * ya ha hecho, dice qué se le dio a cambio, y propone seguir con una
 * fecha concreta. No pide nada en el primer párrafo.
 */
export function mensajeDeRenovacion({
  patrocinador,
  nombreDelClub,
  temporada,
}: {
  patrocinador: ClubSponsor;
  nombreDelClub: string;
  temporada: string;
}): string {
  const anios =
    patrocinador.sinceYear && patrocinador.sinceYear > 0
      ? new Date().getFullYear() - patrocinador.sinceYear
      : 0;

  const desde =
    anios >= 1
      ? `Lleváis con nosotros desde ${patrocinador.sinceYear}, ${
          anios === 1 ? "una temporada" : `${anios} temporadas`
        }.`
      : "Gracias por haber estado con nosotros esta temporada.";

  const loAcordado = patrocinador.renewalNotes
    ? `\n\nLo que acordamos: ${patrocinador.renewalNotes}`
    : "";

  return [
    `Hola:`,
    ``,
    `Os escribo del ${nombreDelClub}. ${desde} Vuestro apoyo se ha visto en el club y queríamos daros las gracias antes de nada.${loAcordado}`,
    ``,
    `Estamos cerrando ya la temporada ${temporada} y me gustaría saber si queréis seguir con nosotros. Si os parece, os preparo lo que hicimos este año y lo que podemos ofreceros el que viene, y lo vemos sin compromiso.`,
    ``,
    `¿Os va bien que os llame esta semana?`,
    ``,
    `Un saludo,`,
    nombreDelClub,
  ].join("\n");
}

/** "2026/27", a partir de la fecha de hoy. */
export function temporadaDe(hoy: Date): string {
  // La temporada deportiva arranca en verano: de enero a junio todavía
  // se está jugando la que empezó el año anterior.
  const anio = hoy.getMonth() >= 6 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${anio}/${String((anio + 1) % 100).padStart(2, "0")}`;
}
