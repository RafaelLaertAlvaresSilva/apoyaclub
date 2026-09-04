import { estadoVisible, hoyISO, type TareaPatrocinio } from "@/lib/tareas-patrocinio";

/**
 * El informe que el club le entrega a un patrocinador.
 *
 * Es la razón de ser de toda la agenda de tareas. El motivo por el que
 * un patrocinador de barrio no renueva casi nunca es el precio: es que
 * en junio no sabe decir qué recibió por sus 1.200 €. El club sí lo
 * sabe —lo ha ido marcando— y esto es enseñárselo en un folio.
 *
 * Aquí solo va el cálculo. La maqueta del PDF y la del Word están en
 * `informe-pdf.tsx` e `informe-docx.ts`.
 */

export type ResumenInforme = {
  empresa: string;
  /** Cumplidas, de la más antigua a la más reciente. */
  cumplidas: TareaPatrocinio[];
  /** Lo que sigue en marcha, con fecha por delante. */
  enMarcha: TareaPatrocinio[];
  /** Pendientes con la fecha ya pasada. No se esconden. */
  vencidas: TareaPatrocinio[];
  total: number;
  /** Cuántas de las cumplidas tienen enlace a la prueba. */
  conPrueba: number;
  /** Primera y última fecha que aparecen, para titular el periodo. */
  desde: string | null;
  hasta: string | null;
};

/**
 * Prepara el informe de una empresa a partir de todas las tareas del
 * club.
 *
 * Las canceladas quedan fuera: son cosas que se acordó no hacer, y
 * meterlas solo confunde a quien lee.
 *
 * Las vencidas sí entran, y a la vista. Es tentador enseñar solo lo
 * cumplido, pero un informe que oculta lo que falta se cae en cuanto el
 * empresario recuerda la publicación que nunca vio, y con él se cae la
 * confianza en todo lo demás. Enseñarlo con su fecha es lo que hace que
 * el resto se crea.
 */
export function prepararInforme(
  empresa: string,
  tareas: TareaPatrocinio[],
  hoy: string = hoyISO(),
): ResumenInforme {
  const suyas = tareas.filter(
    (tarea) => tarea.empresa.trim().toLowerCase() === empresa.trim().toLowerCase(),
  );

  const activas = suyas.filter((tarea) => tarea.estado !== "cancelado");
  const porFecha = (a: TareaPatrocinio, b: TareaPatrocinio) => a.fin.localeCompare(b.fin);

  const cumplidas = activas.filter((tarea) => tarea.estado === "hecho").sort(porFecha);
  const vencidas = activas
    .filter((tarea) => estadoVisible(tarea, hoy) === "caducada")
    .sort(porFecha);
  const enMarcha = activas
    .filter((tarea) => {
      const estado = estadoVisible(tarea, hoy);
      return estado === "hoy" || estado === "pronto" || estado === "programada";
    })
    .sort(porFecha);

  const fechas = activas.map((tarea) => tarea.fin).sort();

  return {
    empresa: empresa.trim(),
    cumplidas,
    enMarcha,
    vencidas,
    total: activas.length,
    conPrueba: cumplidas.filter((tarea) => !!tarea.pruebaUrl).length,
    desde: fechas[0] ?? null,
    hasta: fechas[fechas.length - 1] ?? null,
  };
}

/**
 * La frase de cabecera del informe. Es lo primero que lee el
 * patrocinador y tiene que decir la verdad en una línea, buena o mala.
 */
export function fraseDeResumen(informe: ResumenInforme): string {
  if (informe.total === 0) return "Todavía no hay acciones registradas.";

  const cumplidas = informe.cumplidas.length;

  if (cumplidas === informe.total) {
    return informe.total === 1
      ? "Se ha cumplido la acción acordada."
      : `Se han cumplido las ${informe.total} acciones acordadas.`;
  }

  return `${cumplidas} de ${informe.total} acciones acordadas ya están cumplidas.`;
}
