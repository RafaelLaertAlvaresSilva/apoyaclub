"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { redirect as redirectLocalizado } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";
import { esPlanValido, priceIdDelPlan, type PlanId } from "@/lib/planes";
import { obtenerStripe } from "@/lib/stripe/client";
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
 * Checkout para el plan elegido (mensual, temporada o fundador; ver
 * `lib/planes.ts`) con 30 días de prueba gratuita y sin cobro inicial. El estado real de la suscripción
 * se guarda cuando llega el webhook `checkout.session.completed`, no
 * aquí: esta acción solo abre el pago.
 *
 * Fase 14: las redirecciones internas (de vuelta a `/[locale]/panel/suscripcion`)
 * usan `redirectLocalizado` (antepone el idioma solo); la redirección
 * final a Stripe Checkout es una URL externa absoluta, así que usa el
 * `redirect` normal de Next.js, sin pasar por next-intl.
 */
export async function iniciarSuscripcion(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=sesion`, locale });
  const { supabase, user } = contexto;

  const solicitado = String(formData.get("plan") ?? "");
  const planId: PlanId = esPlanValido(solicitado) ? solicitado : "temporada";

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<Pick<SubscriptionRow, "stripe_customer_id">>();

  // El plan fundador tiene plazas contadas. Se reserva ANTES de abrir el
  // pago: si se reservase después, dos clubes podrían pagar la misma
  // plaza y habría que devolverle el dinero a uno. Si ya no quedan, se
  // le manda de vuelta con un aviso en vez de cobrarle un precio que ya
  // no le corresponde.
  if (planId === "fundador") {
    const { data: plaza } = await supabase.rpc("reservar_plaza_fundador", { p_club_id: user.id });
    if (plaza == null) {
      return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=sin-plazas`, locale });
    }
  } else {
    // Si venía de abrir el pago de Fundador y no lo terminó, su plaza
    // vuelve al montón en este mismo instante: acaba de elegir otro
    // plan, así que ya no hay nada que reservarle (migración 0040).
    await supabase.rpc("liberar_plaza_fundador", { p_club_id: user.id });
    await supabase.from("clubs").update({ plan: planId }).eq("id", user.id);
  }

  let priceId: string;
  try {
    priceId = priceIdDelPlan(planId);
  } catch (excepcion) {
    console.error("[stripe] Plan sin precio configurado:", excepcion);
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=checkout`, locale });
  }

  const stripe = obtenerStripe();
  const sesionCheckout = await stripe.checkout.sessions
    .create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { plan: planId },
      },
      metadata: { plan: planId, club_id: user.id },
      // Si el club ya tuvo un cliente de Stripe antes (p. ej. canceló y
      // vuelve a suscribirse), se reutiliza en vez de crear uno nuevo.
      customer: filaClub?.stripe_customer_id ?? undefined,
      customer_email: filaClub?.stripe_customer_id ? undefined : (user.email ?? undefined),
      // Recupera el club en el webhook aunque todavía no tenga cliente
      // de Stripe asociado (primera suscripción).
      client_reference_id: user.id,
      success_url: `${SITE_URL}/${locale}${RUTA_SUSCRIPCION}?checkout=success`,
      cancel_url: `${SITE_URL}/${locale}${RUTA_SUSCRIPCION}?checkout=cancel`,
    })
    .catch((excepcion) => {
      console.error("[stripe] No se ha podido crear la sesión de Checkout:", excepcion);
      return null;
    });

  if (!sesionCheckout) {
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=checkout`, locale });
  }
  if (!sesionCheckout.url) {
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=checkout`, locale });
  }

  return redirect(sesionCheckout.url);
}

/**
 * Abre el portal de cliente de Stripe: desde ahí el club puede cambiar
 * de tarjeta, ver sus facturas y cancelar la suscripción. Requiere que
 * ya exista un cliente de Stripe (se haya suscrito alguna vez).
 */
export async function abrirPortalCliente(): Promise<void> {
  const locale = await getLocale();
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=sesion`, locale });
  const { supabase, user } = contexto;

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<Pick<SubscriptionRow, "stripe_customer_id">>();

  if (!filaClub?.stripe_customer_id) {
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=sin-suscripcion`, locale });
  }

  const stripe = obtenerStripe();
  const sesionPortal = await stripe.billingPortal.sessions
    .create({
      customer: filaClub.stripe_customer_id,
      return_url: `${SITE_URL}/${locale}${RUTA_SUSCRIPCION}`,
    })
    .catch((excepcion) => {
      console.error("[stripe] No se ha podido crear la sesión del portal de cliente:", excepcion);
      return null;
    });

  if (!sesionPortal) {
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=portal`, locale });
  }

  return redirect(sesionPortal.url);
}
