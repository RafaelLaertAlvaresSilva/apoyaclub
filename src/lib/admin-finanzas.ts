import { PLANES, centimosAlAnio, centimosAlMes, esPlanValido, type PlanId } from "@/lib/planes";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/**
 * Control financiero del panel de administración (migración 0021).
 *
 * Todo se calcula a partir de lo que hay en `clubs`: qué plan tiene cada
 * club y en qué estado está su suscripción. Stripe sigue siendo la
 * verdad de lo cobrado — aquí no se inventa ningún importe, se aplica el
 * precio del plan que Stripe ya escribió en la fila del club.
 *
 * Los importes se llevan siempre en céntimos enteros: sumar euros en
 * coma flotante acaba dando 1.749,9999999 en cuanto hay decimales.
 *
 * Dos cifras por cada total, porque las dos hacen falta y confundirlas
 * es un error caro: el bruto es lo que paga el club (los precios de
 * ApoyaClub llevan el IVA dentro) y el neto es lo que queda después de
 * liquidar ese IVA, que es el dinero real del negocio.
 */

/** IVA español general. Los precios se anuncian con el IVA incluido. */
export const TIPO_IVA = 0.21;

/** Estados en los que el club está pagando o va a pagar. */
const ESTADOS_QUE_PAGAN: SubscriptionStatus[] = ["active"];
/** Estados en los que hay dinero comprometido pero en riesgo. */
const ESTADOS_EN_RIESGO: SubscriptionStatus[] = ["past_due", "unpaid"];

export type RepartoPlan = {
  planId: PlanId;
  nombre: string;
  clubes: number;
  /** Ingreso recurrente mensual que aportan, en céntimos. */
  centimosAlMes: number;
  /** Ingreso a doce meses, en céntimos. */
  centimosAlAnio: number;
};

export type ClubFacturable = {
  id: string;
  nombre: string;
  planId: PlanId | null;
  estado: SubscriptionStatus;
  /** Importe de su próxima factura, en céntimos. Null si no tiene plan. */
  centimosPorCobro: number | null;
  proximaRenovacion: string | null;
  esFundador: boolean;
  numeroFundador: number | null;
};

export type Finanzas = {
  /** Ingreso recurrente mensual de los clubes que pagan, IVA incluido. */
  mrrCentimos: number;
  /** El mismo, ya descontado el IVA. */
  mrrNetoCentimos: number;
  arrCentimos: number;
  arrNetoCentimos: number;
  /** Lo que entraría al mes si convirtieran todos los que están en prueba. */
  mrrPotencialCentimos: number;
  /** Ingreso mensual comprometido pero con el cobro fallando. */
  mrrEnRiesgoCentimos: number;

  clubesQuePagan: number;
  clubesEnPrueba: number;
  clubesEnRiesgo: number;
  clubesCancelados: number;
  /** Clubes de pago sin plan registrado: normalmente altas anteriores a los tres planes. */
  clubesSinPlan: number;

  reparto: RepartoPlan[];
  plazasFundadorLibres: number;

  /** Cobros previstos en los próximos 30 días, en céntimos. */
  cobrosProximos30diasCentimos: number;

  /** Detalle por club, ordenado por importe descendente. */
  clubes: ClubFacturable[];
};

type FilaFinanzas = {
  id: string;
  name: string;
  plan: string | null;
  founder_number: number | null;
  subscription_status: SubscriptionStatus;
  current_period_end: string | null;
};

/** Quita el IVA de un importe que ya lo lleva dentro. */
export function sinIva(centimos: number): number {
  return Math.round(centimos / (1 + TIPO_IVA));
}

export async function obtenerFinanzas(ahora: Date = new Date()): Promise<Finanzas> {
  const admin = createAdminClient();

  const [{ data: filas }, { data: plazasLibres }] = await Promise.all([
    admin
      .from("clubs")
      .select("id, name, plan, founder_number, subscription_status, current_period_end")
      .returns<FilaFinanzas[]>(),
    admin.rpc("plazas_fundador_libres"),
  ]);

  const clubes = filas ?? [];

  const paga = (fila: FilaFinanzas) => ESTADOS_QUE_PAGAN.includes(fila.subscription_status);
  const enRiesgo = (fila: FilaFinanzas) => ESTADOS_EN_RIESGO.includes(fila.subscription_status);

  let mrrCentimos = 0;
  let mrrPotencialCentimos = 0;
  let mrrEnRiesgoCentimos = 0;
  let clubesSinPlan = 0;
  let cobrosProximos30diasCentimos = 0;

  const porPlan = new Map<PlanId, { clubes: number; centimosAlMes: number; centimosAlAnio: number }>();
  for (const planId of Object.keys(PLANES) as PlanId[]) {
    porPlan.set(planId, { clubes: 0, centimosAlMes: 0, centimosAlAnio: 0 });
  }

  const dentroDe30dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const detalle: ClubFacturable[] = [];

  for (const fila of clubes) {
    const planId = esPlanValido(fila.plan) ? fila.plan : null;

    if (paga(fila) && !planId) clubesSinPlan += 1;

    if (planId) {
      const alMes = centimosAlMes(planId);

      if (paga(fila)) {
        mrrCentimos += alMes;
        const acumulado = porPlan.get(planId)!;
        acumulado.clubes += 1;
        acumulado.centimosAlMes += alMes;
        acumulado.centimosAlAnio += centimosAlAnio(planId);
      }

      if (fila.subscription_status === "trialing") mrrPotencialCentimos += alMes;
      if (enRiesgo(fila)) mrrEnRiesgoCentimos += alMes;

      // Cobro previsto: el importe completo del plan (no el prorrateo)
      // si le toca renovar dentro de los próximos treinta días.
      const renovacion = fila.current_period_end ? new Date(fila.current_period_end) : null;
      const cobraPronto =
        (paga(fila) || fila.subscription_status === "trialing") &&
        renovacion !== null &&
        renovacion > ahora &&
        renovacion <= dentroDe30dias;

      if (cobraPronto) cobrosProximos30diasCentimos += PLANES[planId].precioCentimos;
    }

    if (paga(fila) || enRiesgo(fila) || fila.subscription_status === "trialing") {
      detalle.push({
        id: fila.id,
        nombre: fila.name,
        planId,
        estado: fila.subscription_status,
        centimosPorCobro: planId ? PLANES[planId].precioCentimos : null,
        proximaRenovacion: fila.current_period_end,
        esFundador: fila.founder_number != null,
        numeroFundador: fila.founder_number,
      });
    }
  }

  const arrCentimos = [...porPlan.values()].reduce(
    (suma, acumulado) => suma + acumulado.centimosAlAnio,
    0,
  );

  return {
    mrrCentimos,
    mrrNetoCentimos: sinIva(mrrCentimos),
    arrCentimos,
    arrNetoCentimos: sinIva(arrCentimos),
    mrrPotencialCentimos,
    mrrEnRiesgoCentimos,

    clubesQuePagan: clubes.filter(paga).length,
    clubesEnPrueba: clubes.filter((fila) => fila.subscription_status === "trialing").length,
    clubesEnRiesgo: clubes.filter(enRiesgo).length,
    clubesCancelados: clubes.filter((fila) => fila.subscription_status === "canceled").length,
    clubesSinPlan,

    reparto: (Object.keys(PLANES) as PlanId[]).map((planId) => ({
      planId,
      nombre: PLANES[planId].nombre,
      ...porPlan.get(planId)!,
    })),
    plazasFundadorLibres: typeof plazasLibres === "number" ? plazasLibres : 0,

    cobrosProximos30diasCentimos,

    clubes: detalle.sort((a, b) => (b.centimosPorCobro ?? 0) - (a.centimosPorCobro ?? 0)),
  };
}
