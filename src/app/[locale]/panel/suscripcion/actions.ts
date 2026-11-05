"use server";

import { getTranslations } from "next-intl/server";
import { diasDePruebaQueQuedan } from "@/lib/acceso-club";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { redirect as redirectLocalizado } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";
import { llevaIvaEspanol, tipoDeIvaDeStripe } from "@/lib/iva-espana";
import { paisDeLaCuenta } from "@/lib/paises";
import { esPlanValido, monedaDelPais, priceIdDelPlan, type PlanId } from "@/lib/planes";
import type Stripe from "stripe";
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
  const t = await getTranslations("panel.acciones");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("tuSesionCaducadoVuelveIniciar") };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "club") {
    return { error: t("estaAccionSoloEstaDisponible") };
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
  // La moneda la decide el país de la cuenta del club, que él no puede
  // cambiar: un club de Brasil paga en reales, el resto en euros.
  const moneda = monedaDelPais(paisDeLaCuenta(user.app_metadata));

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_customer_id, trial_ends_at, province, postal_code")
    .eq("id", user.id)
    .maybeSingle<
      Pick<SubscriptionRow, "stripe_customer_id" | "trial_ends_at"> & {
        province: string | null;
        postal_code: string | null;
      }
    >();

  // La prueba no se regala dos veces. Stripe daba 30 días a todo el que
  // contratara, sin mirar si el club ya se había gastado su mes gratis:
  // quien se registraba, lo usaba entero y luego pagaba acababa con dos
  // meses. Ahora Stripe solo continúa la prueba que ya estaba corriendo,
  // y si no queda nada, el primer recibo se cobra al momento.
  const diasDePrueba = diasDePruebaQueQuedan(filaClub?.trial_ends_at ?? null);

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
    priceId = priceIdDelPlan(planId, moneda);
  } catch (excepcion) {
    console.error("[stripe] Plan sin precio configurado:", excepcion);
    return redirectLocalizado({ href: `${RUTA_SUSCRIPCION}?error=checkout`, locale });
  }

  const stripe = obtenerStripe();
  const tipoDeIva =
    moneda === "EUR" &&
    llevaIvaEspanol({
      pais: paisDeLaCuenta(user.app_metadata),
      province: filaClub?.province,
      postalCode: filaClub?.postal_code,
    })
      ? tipoDeIvaDeStripe()
      : null;

  const crearSesion = (metodos?: Stripe.Checkout.SessionCreateParams.PaymentMethodType[]) =>
    stripe.checkout.sessions.create({
      // En reales, Pix (que exige un banco de Brasil) y tarjeta (que
      // luego se comprueba que sea de Brasil: `lib/pago-brasil.ts`).
      ...(metodos ? { payment_method_types: metodos } : {}),
      mode: "subscription",
      // Con el IVA desglosado en la factura, solo a los clubes de España
      // fuera de Canarias, Ceuta y Melilla (`lib/iva-espana.ts`). El
      // precio no cambia: el tipo va "incluido en el precio".
      line_items: [{ price: priceId, quantity: 1, ...(tipoDeIva ? { tax_rates: [tipoDeIva] } : {}) }],
      subscription_data: {
        ...(diasDePrueba > 0 ? { trial_period_days: diasDePrueba } : {}),
        metadata: { plan: planId },
      },
      metadata: { plan: planId, club_id: user.id },
      // Si el club ya tuvo un cliente de Stripe antes (p. ej. canceló y
      // vuelve a suscribirse), se reutiliza en vez de crear uno nuevo.
      customer: filaClub?.stripe_customer_id ?? undefined,
      customer_email: filaClub?.stripe_customer_id ? undefined : (user.email ?? undefined),

      // Datos fiscales del club, pedidos en el momento de pagar.
      //
      // Sin esto solo se sabía el correo y la tarjeta, y con eso no se
      // puede emitir una factura: falta a quién se le hace. Reclamárselo
      // después, club por club, es media mañana al mes en cuanto haya
      // veinte. Aquí se pide una vez, cuando el tesorero ya está con la
      // tarjeta en la mano y no le cuesta nada.
      //
      // El NIF se pide aparte de la dirección porque muchos clubes de
      // base son asociaciones deportivas con CIF, no autónomos, y
      // Stripe valida el formato español si se le dice que lo pida.
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },

      // Cuando el cliente ya existe, Stripe no guarda encima lo que el
      // club escriba si no se le autoriza expresamente. Sin estas dos
      // líneas, un club que corrige su dirección al renovar vería cómo
      // su factura sigue saliendo con la vieja.
      ...(filaClub?.stripe_customer_id
        ? { customer_update: { address: "auto" as const, name: "auto" as const } }
        : {}),
      // Recupera el club en el webhook aunque todavía no tenga cliente
      // de Stripe asociado (primera suscripción).
      client_reference_id: user.id,
      // Con el id de la sesión, la página de vuelta puede comprobar el
      // pago de Brasil sin esperar al webhook.
      success_url: `${SITE_URL}/${locale}${RUTA_SUSCRIPCION}?checkout=success&sesion={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/${locale}${RUTA_SUSCRIPCION}?checkout=cancel`,
    });

  const alFallar = (excepcion: unknown) => {
    console.error("[stripe] No se ha podido crear la sesión de Checkout:", excepcion);
    return null;
  };

  // Si Pix todavía no está activado en Stripe, la sesión con Pix falla:
  // entonces se abre solo con tarjeta, que se comprueba igual.
  const sesionCheckout =
    moneda === "BRL"
      ? await crearSesion(["card", "pix"]).catch(() => crearSesion(["card"]).catch(alFallar))
      : await crearSesion().catch(alFallar);

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
