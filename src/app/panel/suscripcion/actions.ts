"use server";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { obtenerStripe, obtenerStripePriceId } from "@/lib/stripe/client";
import type { SubscriptionRow } from "@/lib/subscription-mappers";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const RUTA_SUSCRIPCION = "/panel/suscripcion";

/**
 * Igual que `obtenerClubActual` en `app/panel/dossier/actions.ts`: cada
 * Server Action se valida a sí misma (sesión + rol "club"), aunque el
 * middleware ya protege `/panel`.
 */
async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  return { supabase, user };
}

/**
 * Empieza (o retoma) la suscripción del club: crea una sesión de Stripe
 * Checkout para el único plan (29,90€/mes, IVA incluido) con 30 días de
 * prueba gratuita y sin cobro inicial. El estado real de la suscripción
 * se guarda cuando llega el webhook `checkout.session.completed`, no
 * aquí: esta acción solo abre el pago.
 */
export async function iniciarSuscripcion(): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) redirect(`${RUTA_SUSCRIPCION}?error=sesion`);
  const { supabase, user } = contexto;

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<Pick<SubscriptionRow, "stripe_customer_id">>();

  const stripe = obtenerStripe();
  const sesionCheckout = await stripe.checkout.sessions
    .create({
      mode: "subscription",
      line_items: [{ price: obtenerStripePriceId(), quantity: 1 }],
      subscription_data: { trial_period_days: 30 },
      // Si el club ya tuvo un cliente de Stripe antes (p. ej. canceló y
      // vuelve a suscribirse), se reutiliza en vez de crear uno nuevo.
      customer: filaClub?.stripe_customer_id ?? undefined,
      customer_email: filaClub?.stripe_customer_id ? undefined : (user.email ?? undefined),
      // Recupera el club en el webhook aunque todavía no tenga cliente
      // de Stripe asociado (primera suscripción).
      client_reference_id: user.id,
      success_url: `${SITE_URL}${RUTA_SUSCRIPCION}?checkout=success`,
      cancel_url: `${SITE_URL}${RUTA_SUSCRIPCION}?checkout=cancel`,
    })
    .catch((excepcion) => {
      console.error("[stripe] No se ha podido crear la sesión de Checkout:", excepcion);
      return null;
    });

  if (!sesionCheckout) {
    redirect(`${RUTA_SUSCRIPCION}?error=checkout`);
  }
  if (!sesionCheckout.url) {
    redirect(`${RUTA_SUSCRIPCION}?error=checkout`);
  }

  redirect(sesionCheckout.url);
}

/**
 * Abre el portal de cliente de Stripe: desde ahí el club puede cambiar
 * de tarjeta, ver sus facturas y cancelar la suscripción. Requiere que
 * ya exista un cliente de Stripe (se haya suscrito alguna vez).
 */
export async function abrirPortalCliente(): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) redirect(`${RUTA_SUSCRIPCION}?error=sesion`);
  const { supabase, user } = contexto;

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<Pick<SubscriptionRow, "stripe_customer_id">>();

  if (!filaClub?.stripe_customer_id) {
    redirect(`${RUTA_SUSCRIPCION}?error=sin-suscripcion`);
  }

  const stripe = obtenerStripe();
  const sesionPortal = await stripe.billingPortal.sessions
    .create({
      customer: filaClub.stripe_customer_id,
      return_url: `${SITE_URL}${RUTA_SUSCRIPCION}`,
    })
    .catch((excepcion) => {
      console.error("[stripe] No se ha podido crear la sesión del portal de cliente:", excepcion);
      return null;
    });

  if (!sesionPortal) {
    redirect(`${RUTA_SUSCRIPCION}?error=portal`);
  }

  redirect(sesionPortal.url);
}
