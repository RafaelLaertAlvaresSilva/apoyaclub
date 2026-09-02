import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import {
  esVisiblePublicamente,
  etiquetaEstadoSuscripcion,
  subscriptionRowToInfo,
  type SubscriptionRow,
} from "@/lib/subscription-mappers";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { abrirPortalCliente, iniciarSuscripcion } from "./actions";

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MENSAJES_ERROR: Record<string, string> = {
  sesion: "Tu sesión ha caducado. Vuelve a iniciar sesión e inténtalo de nuevo.",
  checkout: "No se ha podido abrir la pasarela de pago. Inténtalo de nuevo en unos minutos.",
  portal: "No se ha podido abrir el portal de gestión de la suscripción. Inténtalo de nuevo en unos minutos.",
  "sin-suscripcion": "Todavía no tienes ninguna suscripción que gestionar.",
};

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string }>;
}) {
  const t = await getTranslations("panel.suscripcion");
  const { error, checkout } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const { data: filaSuscripcion } = await supabase
    .from("clubs")
    .select(
      "stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end",
    )
    .eq("id", user.id)
    .maybeSingle<SubscriptionRow>();

  const suscripcion = subscriptionRowToInfo(
    filaSuscripcion ?? {
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      trial_ends_at: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
  );

  // El portal de Stripe sirve para gestionar una suscripción en curso
  // (cambiar tarjeta, cancelar); si ya ha terminado del todo, hace
  // falta empezar una nueva desde Checkout.
  const puedeGestionar = Boolean(suscripcion.stripeCustomerId) && suscripcion.status !== "canceled";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("suscripcion")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="suscripcion" />

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        {checkout === "success" && (
          <div className="mb-4">
            <AvisoExito mensaje="¡Gracias! Estamos confirmando tu suscripción con Stripe: en unos segundos se reflejará aquí." />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <AvisoError mensaje={MENSAJES_ERROR[error] ?? "Ha ocurrido un error inesperado."} />
          </div>
        )}

        <h2 className="text-base font-semibold text-zinc-900">{t("planUnico")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("t2990mesiva")}</p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("estado")}</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {etiquetaEstadoSuscripcion(suscripcion.status)}
            </dd>
          </div>

          {suscripcion.status === "trialing" && suscripcion.currentPeriodEnd && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("finDeLaPrueba")}</dt>
              <dd className="mt-1 text-sm text-zinc-700">
                {formatearFecha(suscripcion.currentPeriodEnd)} — después se cobrarán 29,90 €/mes.
              </dd>
            </div>
          )}

          {suscripcion.status === "active" && suscripcion.currentPeriodEnd && !suscripcion.cancelAtPeriodEnd && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("proximaRenovacion")}</dt>
              <dd className="mt-1 text-sm text-zinc-700">{formatearFecha(suscripcion.currentPeriodEnd)}</dd>
            </div>
          )}

          {suscripcion.cancelAtPeriodEnd && suscripcion.currentPeriodEnd && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Acceso hasta (cancelada)
              </dt>
              <dd className="mt-1 text-sm text-red-700">{formatearFecha(suscripcion.currentPeriodEnd)}</dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("visibilidadPublica")}</dt>
            <dd className="mt-1 text-sm text-zinc-700">
              {esVisiblePublicamente(suscripcion.status)
                ? "Tu página pública y tus oportunidades son visibles."
                : "Tu página pública y tus oportunidades NO son visibles ahora mismo."}
            </dd>
          </div>
        </dl>

        <div className="mt-6 max-w-xs">
          {puedeGestionar ? (
            <form action={abrirPortalCliente}>
              <BotonEnviar>{t("gestionarSuscripcion")}</BotonEnviar>
            </form>
          ) : (
            <form action={iniciarSuscripcion}>
              <BotonEnviar>
                {suscripcion.status === "canceled" ? "Volver a suscribirse" : "Empezar prueba gratuita de 30 días"}
              </BotonEnviar>
            </form>
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Conservas todos tus datos aunque la suscripción no esté activa: solo se oculta tu página
          pública y tus oportunidades hasta que vuelvas a suscribirte. Desde &quot;Gestionar
          suscripción&quot; puedes cambiar de tarjeta, ver tus facturas o cancelar.
        </p>
      </section>
    </div>
  );
}
