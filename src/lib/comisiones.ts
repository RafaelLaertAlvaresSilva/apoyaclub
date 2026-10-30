import { TIPO_IVA } from "@/lib/admin-finanzas";

/**
 * La comisión de un representante, cobro a cobro.
 *
 * Lo acordado con Rafael: de cada cobro de un club de su país,
 *
 *   lo que paga el club
 *   − el IVA que va dentro del precio (no es dinero del negocio: se liquida)
 *   − lo que Stripe se queda de ese cobro (la comisión real, no una estimada)
 *   = lo que queda; y de eso, su porcentaje (30 %).
 *
 * Los cobros se leen de Stripe y no de la suscripción guardada en la
 * base de datos, porque la comisión de Stripe solo se sabe una vez
 * cobrado, y porque así lo que ve el representante es exactamente lo
 * que se le va a pagar, incluidas las devoluciones.
 *
 * Aquí solo están las cuentas, sin Stripe, para poder probarlas.
 */

export type Cobro = {
  /** Identificador del cobro en Stripe. */
  id: string;
  clubId: string;
  clubNombre: string;
  /** Cuándo se cobró (ISO). */
  fecha: string;
  /** Lo que pagó el club, ya restadas las devoluciones, IVA incluido. En céntimos. */
  cobradoCentimos: number;
  /** Lo que Stripe se quedó de este cobro. En céntimos. */
  stripeCentimos: number;
};

export type CobroConParte = Cobro & {
  ivaCentimos: number;
  netoCentimos: number;
  parteCentimos: number;
};

export type MesDeComision = {
  /** "2026-11" */
  mes: string;
  cobros: CobroConParte[];
  cobradoCentimos: number;
  ivaCentimos: number;
  stripeCentimos: number;
  netoCentimos: number;
  parteCentimos: number;
};

/** El IVA que va dentro de un precio con IVA incluido. */
export function ivaIncluido(conIvaCentimos: number, tipo = TIPO_IVA): number {
  return Math.round(conIvaCentimos - conIvaCentimos / (1 + tipo));
}

export function parteDelCobro(cobro: Cobro, porcentaje: number): CobroConParte {
  const ivaCentimos = ivaIncluido(cobro.cobradoCentimos);
  // Un cobro devuelto entero puede dejar la comisión de Stripe sin
  // nada de qué salir: entonces no hay parte, pero tampoco se resta.
  const netoCentimos = Math.max(0, cobro.cobradoCentimos - ivaCentimos - cobro.stripeCentimos);
  return {
    ...cobro,
    ivaCentimos,
    netoCentimos,
    parteCentimos: Math.round((netoCentimos * porcentaje) / 100),
  };
}

/** El mes de una fecha en la hora de España, que es como se cierra la cuenta. */
export function mesDe(fechaIso: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(fechaIso));
  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  return `${anio}-${mes}`;
}

/**
 * Los cobros, con la parte del representante, agrupados por mes (el
 * más reciente primero). Solo cuentan los cobrados desde `desde`: el
 * representante cobra por lo que entra desde que empezó, no por lo de
 * antes.
 */
export function comisionPorMes(cobros: Cobro[], porcentaje: number, desde: string | null = null): MesDeComision[] {
  const inicio = desde ? new Date(desde).getTime() : Number.NEGATIVE_INFINITY;
  const meses = new Map<string, MesDeComision>();

  for (const cobro of cobros) {
    if (new Date(cobro.fecha).getTime() < inicio || cobro.cobradoCentimos <= 0) continue;

    const conParte = parteDelCobro(cobro, porcentaje);
    const clave = mesDe(cobro.fecha);
    const mes = meses.get(clave) ?? {
      mes: clave,
      cobros: [],
      cobradoCentimos: 0,
      ivaCentimos: 0,
      stripeCentimos: 0,
      netoCentimos: 0,
      parteCentimos: 0,
    };

    mes.cobros.push(conParte);
    mes.cobradoCentimos += conParte.cobradoCentimos;
    mes.ivaCentimos += conParte.ivaCentimos;
    mes.stripeCentimos += conParte.stripeCentimos;
    mes.netoCentimos += conParte.netoCentimos;
    mes.parteCentimos += conParte.parteCentimos;
    meses.set(clave, mes);
  }

  for (const mes of meses.values()) {
    mes.cobros.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
  return [...meses.values()].sort((a, b) => b.mes.localeCompare(a.mes));
}
