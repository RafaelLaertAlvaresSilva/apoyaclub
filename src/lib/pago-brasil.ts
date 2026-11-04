import type Stripe from "stripe";

/**
 * El candado del precio de Brasil.
 *
 * Los planes en reales salen más baratos que en euros, así que un club de
 * España o de Portugal podría querer pagarlos. Hay tres barreras:
 *
 *   1. Solo se ofrecen a clubes con país Brasil en su cuenta, que el club
 *      no puede cambiar (`lib/paises.ts`; lo cambia el administrador).
 *   2. Se pagan con Pix, que exige una cuenta de banco en Brasil, o con
 *      tarjeta. Y si es tarjeta, tiene que estar emitida en Brasil: es lo
 *      que se comprueba aquí.
 *   3. El representante de Brasil ve todos los clubes de su país.
 *
 * Si una suscripción en reales se paga con una tarjeta de fuera, se
 * cancela en el acto y se devuelve lo que se haya cobrado. El club vuelve
 * a su página de suscripción con un aviso: que pague en euros, o que su
 * país está mal y escriba para cambiarlo.
 */

export type VeredictoPago = "ok" | "tarjeta-extranjera";

/** Si un método de pago vale para un precio en reales. */
export function metodoValidoParaBrasil(metodo: Pick<Stripe.PaymentMethod, "type" | "card"> | null): boolean {
  // Sin método todavía (un Pix que aún no ha llegado): no se rechaza
  // nada por adelantado.
  if (!metodo) return true;
  if (metodo.type === "pix") return true;
  if (metodo.type === "card") return metodo.card?.country === "BR";
  // Cualquier otro (no debería poder elegirse): no.
  return false;
}

function metodoDeLaSuscripcion(suscripcion: Stripe.Subscription): Stripe.PaymentMethod | null {
  const metodo = suscripcion.default_payment_method;
  return metodo && typeof metodo === "object" ? metodo : null;
}

/**
 * Comprueba una suscripción y, si es en reales y la tarjeta no es de
 * Brasil, la cancela y devuelve lo cobrado. Se puede llamar las veces que
 * haga falta (el webhook y la página de vuelta lo hacen las dos): sobre
 * una suscripción ya cancelada no hace nada más.
 */
export async function vigilarPagoBrasil(stripe: Stripe, suscripcionId: string): Promise<VeredictoPago> {
  const suscripcion = await stripe.subscriptions.retrieve(suscripcionId, {
    expand: ["default_payment_method", "latest_invoice"],
  });

  if (suscripcion.currency !== "brl") return "ok";
  if (metodoValidoParaBrasil(metodoDeLaSuscripcion(suscripcion))) return "ok";

  if (suscripcion.status !== "canceled") {
    await stripe.subscriptions.cancel(suscripcion.id);
  }

  // Si ya se había cobrado algo (sin prueba gratis por delante), se
  // devuelve entero.
  const factura = suscripcion.latest_invoice && typeof suscripcion.latest_invoice === "object"
    ? suscripcion.latest_invoice
    : null;
  if (factura && factura.status === "paid" && factura.amount_paid > 0) {
    const cargos = await stripe.charges.list({ customer: String(suscripcion.customer), limit: 10 });
    for (const cargo of cargos.data) {
      if (cargo.paid && !cargo.refunded && cargo.currency === "brl") {
        await stripe.refunds.create({ charge: cargo.id }).catch(() => null);
      }
    }
  }

  return "tarjeta-extranjera";
}
