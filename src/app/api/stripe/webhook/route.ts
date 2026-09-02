import { avisarDeFallo } from "@/lib/monitoring";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { obtenerStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook de Stripe (Fase 10): única fuente de verdad para el estado
 * real de la suscripción de un club. Las Server Actions de
 * `panel/suscripcion` solo abren sesiones de pago o del portal; nunca
 * escriben `subscription_status` directamente, para no desincronizarse
 * de lo que de verdad ha pasado en Stripe.
 *
 * Configúralo en el Dashboard de Stripe (o con `stripe listen` en
 * local) apuntando a `/api/stripe/webhook`, escuchando al menos:
 * `checkout.session.completed`, `customer.subscription.created`,
 * `customer.subscription.updated` y `customer.subscription.deleted`.
 * No hace falta escuchar los eventos de factura (`invoice.*`): un
 * cobro fallido ya hace que Stripe mande `customer.subscription.updated`
 * con `status: "past_due"` (y más adelante "unpaid" o cancelada si
 * se agotan los reintentos), así que un único camino de código
 * mantiene todo sincronizado.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const firma = request.headers.get("stripe-signature");
  const secretoWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  if (!firma || !secretoWebhook) {
    avisarDeFallo("stripe-webhook", "Falta la firma o STRIPE_WEBHOOK_SECRET no está configurado.");
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  const stripe = obtenerStripe();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(payload, firma, secretoWebhook);
  } catch (excepcion) {
    avisarDeFallo("stripe-webhook", "Firma inválida", excepcion);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        const session = evento.data.object as Stripe.Checkout.Session;
        const clubId = session.client_reference_id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!clubId || !subscriptionId || !customerId) {
          avisarDeFallo("stripe-webhook", "checkout.session.completed sin club_id/subscription/customer.");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await guardarSuscripcionPorClubId(admin, clubId, customerId, subscription);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = evento.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        await guardarSuscripcionPorCustomerId(admin, customerId, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = evento.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        const { error } = await admin
          .from("clubs")
          .update({
            subscription_status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          avisarDeFallo("stripe-webhook", "No se ha podido marcar la suscripción como cancelada", error);
        }
        break;
      }

      default:
        // El resto de eventos no nos hace falta escucharlos.
        break;
    }
  } catch (excepcion) {
    avisarDeFallo("stripe-webhook", `Error procesando el evento ${evento.type}`, excepcion);
    // Devolvemos 500 para que Stripe reintente el envío más tarde.
    return NextResponse.json({ error: "Error procesando el evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Stripe dejó de exponer `current_period_end`/`trial_end` de forma
 * fiable a nivel de la propia Subscription en las versiones recientes
 * de su API: ahora vive en cada `SubscriptionItem`. Se comprueban los
 * dos sitios para no depender de una versión de API concreta.
 */
function obtenerFinPeriodoActual(subscription: Stripe.Subscription): number | null {
  const finNivelSuscripcion = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof finNivelSuscripcion === "number") return finNivelSuscripcion;

  const item = subscription.items.data[0] as unknown as { current_period_end?: number } | undefined;
  return item?.current_period_end ?? null;
}

function aIsoONull(timestampUnix: number | null | undefined): string | null {
  return typeof timestampUnix === "number" ? new Date(timestampUnix * 1000).toISOString() : null;
}

/** Datos comunes que se guardan en `clubs` a partir de una Subscription de Stripe. */
function datosSuscripcion(customerId: string, subscription: Stripe.Subscription) {
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

  return {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    trial_ends_at: aIsoONull(subscription.trial_end),
    current_period_end: aIsoONull(obtenerFinPeriodoActual(subscription)),
    cancel_at_period_end: cancelAtPeriodEnd,
    // Si ya no hay cancelación programada (nunca la hubo, o el club la
    // ha deshecho desde el portal de Stripe), se vacían los avisos
    // enviados para que una futura cancelación los vuelva a disparar.
    ...(cancelAtPeriodEnd
      ? {}
      : { reminder_7d_sent_at: null, reminder_3d_sent_at: null, reminder_1d_sent_at: null }),
  };
}

async function guardarSuscripcionPorClubId(
  admin: ReturnType<typeof createAdminClient>,
  clubId: string,
  customerId: string,
  subscription: Stripe.Subscription,
) {
  const { error } = await admin
    .from("clubs")
    .update(datosSuscripcion(customerId, subscription))
    .eq("id", clubId);

  if (error) {
    avisarDeFallo("stripe-webhook", "No se ha podido guardar la suscripción (por club_id)", error);
  }
}

async function guardarSuscripcionPorCustomerId(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
  subscription: Stripe.Subscription,
) {
  const { error } = await admin
    .from("clubs")
    .update(datosSuscripcion(customerId, subscription))
    .eq("stripe_customer_id", customerId);

  if (error) {
    avisarDeFallo("stripe-webhook", "No se ha podido guardar la suscripción (por customer_id)", error);
  }
}
