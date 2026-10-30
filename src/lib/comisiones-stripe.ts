import type Stripe from "stripe";
import { obtenerStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Cobro } from "@/lib/comisiones";

type FilaClub = { id: string; name: string | null; stripe_customer_id: string | null };

/**
 * Los cobros de Stripe de unos clubes, con lo que Stripe se quedó de
 * cada uno. Ver `lib/comisiones.ts` para las cuentas.
 *
 * Se piden los cargos de cada cliente con su movimiento de saldo
 * (`balance_transaction`), que es donde Stripe apunta su comisión real
 * y el importe ya pasado a euros si el club pagó en otra moneda.
 */
export async function cobrosDeClubes(idsClubes: string[]): Promise<Cobro[]> {
  if (idsClubes.length === 0) return [];

  const admin = createAdminClient();
  const { data: filas } = await admin
    .from("clubs")
    .select("id, name, stripe_customer_id")
    .in("id", idsClubes)
    .returns<FilaClub[]>();

  const conCliente = (filas ?? []).filter((fila) => fila.stripe_customer_id);
  if (conCliente.length === 0) return [];

  const stripe = obtenerStripe();
  const cobros: Cobro[] = [];

  for (const fila of conCliente) {
    const cargos = stripe.charges.list({
      customer: fila.stripe_customer_id!,
      limit: 100,
      expand: ["data.balance_transaction"],
    });

    for await (const cargo of cargos) {
      if (cargo.status !== "succeeded" || !cargo.paid) continue;

      const movimiento =
        cargo.balance_transaction && typeof cargo.balance_transaction === "object"
          ? (cargo.balance_transaction as Stripe.BalanceTransaction)
          : null;

      // En euros, que es en lo que se liquida. Si el club pagó en otra
      // moneda, el movimiento ya trae el importe convertido; la parte
      // devuelta se descuenta en la misma proporción.
      const proporcionCobrada = cargo.amount > 0 ? (cargo.amount - cargo.amount_refunded) / cargo.amount : 0;
      const importe = movimiento ? movimiento.amount : cargo.amount;

      cobros.push({
        id: cargo.id,
        clubId: fila.id,
        clubNombre: fila.name || "(club sin nombre)",
        fecha: new Date(cargo.created * 1000).toISOString(),
        cobradoCentimos: Math.round(importe * proporcionCobrada),
        stripeCentimos: movimiento?.fee ?? 0,
      });
    }
  }

  return cobros;
}
