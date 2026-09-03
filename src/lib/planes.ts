/**
 * Los tres planes de ApoyaClub (migración 0021).
 *
 * Este archivo es la única definición de los precios en el código: la
 * página de suscripción, el área financiera del administrador y los
 * correos leen todos de aquí. Los importes están en céntimos y con el
 * IVA ya incluido, que es como se le enseñan al club — un club de base
 * no puede deducirse el IVA en la práctica, así que enseñar el precio
 * sin IVA sería enseñar un precio que nadie paga.
 *
 * En Stripe hay un Price por plan; el id de cada uno vive en una
 * variable de entorno (ver `.env.local.example`).
 */

export type PlanId = "mensual" | "temporada" | "fundador";

export type Plan = {
  id: PlanId;
  nombre: string;
  /** Precio en céntimos, IVA incluido. */
  precioCentimos: number;
  intervalo: "mes" | "anio";
  /** Frase corta bajo el precio. */
  reclamo: string;
  /** Por qué le conviene al club. */
  detalle: string;
  /** true si es el plan que se quiere vender. */
  destacado: boolean;
  /** true si depende de que queden plazas de fundador. */
  limitado: boolean;
  /** Nombre de la variable de entorno con el id del Price de Stripe. */
  variableEntorno: string;
};

export const PLANES: Record<PlanId, Plan> = {
  mensual: {
    id: "mensual",
    nombre: "Mensual",
    precioCentimos: 2990,
    intervalo: "mes",
    reclamo: "Sin permanencia, cancelas cuando quieras.",
    detalle: "Al año son 358,80 €. Si vas a estar más de ocho meses, sale mejor el de temporada.",
    destacado: false,
    limitado: false,
    variableEntorno: "STRIPE_PRICE_MENSUAL",
  },
  temporada: {
    id: "temporada",
    nombre: "Temporada",
    precioCentimos: 24900,
    intervalo: "anio",
    reclamo: "Un pago al año. Ahorras 109,80 €.",
    detalle:
      "Pensado para cómo funciona un club: la junta aprueba el gasto una vez y ya está cubierta toda la temporada.",
    destacado: true,
    limitado: false,
    variableEntorno: "STRIPE_PRICE_TEMPORADA",
  },
  fundador: {
    id: "fundador",
    nombre: "Fundador",
    precioCentimos: 19900,
    intervalo: "anio",
    reclamo: "Precio congelado de por vida.",
    detalle:
      "Solo para los primeros clubes que entran en la plataforma. El precio no sube nunca mientras sigas de alta.",
    destacado: false,
    limitado: true,
    variableEntorno: "STRIPE_PRICE_FUNDADOR",
  },
};

export const PLANES_EN_ORDEN: Plan[] = [PLANES.fundador, PLANES.temporada, PLANES.mensual];

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** "29,90 €" */
export function precioFormateado(plan: Plan): string {
  return formatoEuros.format(plan.precioCentimos / 100);
}

/** "al mes" / "al año" */
export function periodicidad(plan: Plan): string {
  return plan.intervalo === "mes" ? "al mes" : "al año";
}

/**
 * Lo que aporta el plan al mes, en céntimos, para poder sumar clubes con
 * planes distintos en el área financiera. Los anuales se dividen entre
 * doce: no es lo que entra en caja ese mes, es ingreso recurrente
 * comparable, que es la cifra con la que se decide si el negocio crece.
 */
export function centimosAlMes(planId: PlanId): number {
  const plan = PLANES[planId];
  return plan.intervalo === "mes" ? plan.precioCentimos : Math.round(plan.precioCentimos / 12);
}

/** Lo que aporta el plan en un año completo, en céntimos. */
export function centimosAlAnio(planId: PlanId): number {
  const plan = PLANES[planId];
  return plan.intervalo === "mes" ? plan.precioCentimos * 12 : plan.precioCentimos;
}

/** true si el texto es uno de los tres planes conocidos. */
export function esPlanValido(valor: string | null | undefined): valor is PlanId {
  return valor === "mensual" || valor === "temporada" || valor === "fundador";
}

/**
 * Id del Price de Stripe correspondiente al plan.
 *
 * `STRIPE_PRICE_ID` se sigue aceptando como el precio mensual para no
 * romper las instalaciones que ya lo tenían configurado antes de que
 * existieran los tres planes.
 */
export function priceIdDelPlan(planId: PlanId): string {
  const plan = PLANES[planId];
  const valor =
    process.env[plan.variableEntorno] ??
    (planId === "mensual" ? process.env.STRIPE_PRICE_ID : undefined);

  if (!valor) {
    throw new Error(
      `Falta ${plan.variableEntorno}: crea en Stripe el precio del plan "${plan.nombre}" (${precioFormateado(plan)} ${periodicidad(plan)}) y pon su id en .env.local.`,
    );
  }

  return valor;
}

/** Plan al que corresponde un Price de Stripe, o null si no es ninguno. */
export function planDelPriceId(priceId: string): PlanId | null {
  for (const plan of PLANES_EN_ORDEN) {
    const configurado =
      process.env[plan.variableEntorno] ??
      (plan.id === "mensual" ? process.env.STRIPE_PRICE_ID : undefined);
    if (configurado && configurado === priceId) return plan.id;
  }
  return null;
}
