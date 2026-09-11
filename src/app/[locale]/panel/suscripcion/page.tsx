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
import { esAccesoRegalado } from "@/lib/acceso-gratuito";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { PLANES, esPlanValido, periodicidad, precioFormateado } from "@/lib/planes";
import { abrirPortalCliente } from "./actions";
import { SelectorDePlan } from "./components/SelectorDePlan";

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
  "sin-plazas":
    "Se han agotado las plazas de club fundador mientras elegías. Puedes contratar el plan de temporada, que es el siguiente más barato.",
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

  const [{ data: filaSuscripcion }, { data: plazasLibres }] = await Promise.all([
    supabase
      .from("clubs")
      .select(
        "stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end, plan, founder_number",
      )
      .eq("id", user.id)
      .maybeSingle<SubscriptionRow & { plan: string | null; founder_number: number | null }>(),
    // Cuántas plazas de fundador quedan (migración 0021). Si la función
    // todavía no existe en esta base de datos, se toma como 0 y el plan
    // fundador simplemente no se ofrece.
    supabase.rpc("plazas_fundador_libres"),
  ]);

  const planActual = esPlanValido(filaSuscripcion?.plan) ? PLANES[filaSuscripcion.plan] : null;
  const plazasFundadorLibres = typeof plazasLibres === "number" ? plazasLibres : 0;

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

  // Un club invitado por ApoyaClub: por dentro es una prueba gratuita
  // larga (ver `lib/acceso-gratuito.ts`), y lo que le espera al final no
  // es lo mismo que a quien está en su mes de prueba normal.
  const invitado = esAccesoRegalado(suscripcion.status, suscripcion.trialEndsAt);

  // La suscripción ha llegado de verdad cuando existe en Stripe. El
  // estado por sí solo no sirve: un club recién registrado ya está en
  // "trialing" desde el primer día, sin haber pasado por ninguna
  // pasarela de pago.
  const confirmada = Boolean(suscripcion.stripeSubscriptionId);

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
        {/* Volviendo de la pasarela de pago.
            El aviso mira si la confirmación ya ha llegado, en vez de
            fiarse de que la dirección lleve "checkout=success" pegado.
            Antes decía "en unos segundos se reflejará aquí" para
            siempre, incluso con la suscripción ya activa debajo y por
            mucho que se recargara la página: el club leía que algo
            seguía a medias cuando ya estaba hecho. */}
        {checkout === "success" && (
          <div className="mb-4">
            <AvisoExito
              mensaje={
                confirmada
                  ? "Suscripción confirmada. Ya está todo en marcha."
                  : "¡Gracias! Estamos confirmando tu suscripción con Stripe. Suele tardar unos segundos: vuelve a cargar la página en un momento."
              }
            />
          </div>
        )}

        {checkout === "cancel" && (
          <div className="mb-4">
            <AvisoError mensaje="Has salido de la pasarela sin terminar el pago. No se ha cobrado nada y puedes volver a intentarlo cuando quieras." />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <AvisoError mensaje={MENSAJES_ERROR[error] ?? "Ha ocurrido un error inesperado."} />
          </div>
        )}

        <h2 className="text-base font-semibold text-zinc-900">
          {planActual ? `Plan ${planActual.nombre}` : "Tu plan"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {planActual
            ? `${precioFormateado(planActual)} ${periodicidad(planActual)}, IVA incluido.${
                planActual.id === "fundador" && filaSuscripcion?.founder_number
                  ? ` Eres el club fundador nº ${filaSuscripcion.founder_number}: este precio no te sube nunca.`
                  : ""
              }`
            : "Elige cómo quieres pagar cuando termine tu mes gratis."}
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("estado")}</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {etiquetaEstadoSuscripcion(suscripcion.status)}
            </dd>
          </div>

          {suscripcion.status === "trialing" && suscripcion.currentPeriodEnd && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {invitado ? "Acceso de invitado hasta" : t("finDeLaPrueba")}
              </dt>
              <dd className="mt-1 text-sm text-zinc-700">
                {formatearFecha(suscripcion.currentPeriodEnd)}
                {/* Lo que pasa ese día depende de si hay una suscripción
                    de verdad detrás. Decirle "después se cobrarán 29,90 €"
                    a un club al que nadie va a cobrarle nada —porque no ha
                    dado ninguna tarjeta— es prometerle un cobro que no
                    existe y ocultarle el que sí ocurre: que su página deja
                    de verse. */}
                {suscripcion.stripeSubscriptionId
                  ? " — ese día se cobra el primer recibo de tu plan."
                  : invitado
                    ? " — hasta entonces no se te cobra nada. Te avisaremos por correo antes de esa fecha."
                    : " — si para entonces no has elegido plan, tu página deja de verse. No se cobra nada sin que tú lo actives."}
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

        {puedeGestionar ? (
          <div className="mt-6">
            <div className="max-w-xs">
              <form action={abrirPortalCliente}>
                <BotonEnviar>{t("gestionarSuscripcion")}</BotonEnviar>
              </form>
            </div>

            {/* Un club con tesorero y junta directiva necesita las
                facturas para su contabilidad, y si no sabe dónde están
                acaba pidiéndolas por correo una a una. Decirle aquí
                exactamente dónde pinchar ahorra ese correo. */}
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Tus facturas</p>
              <p className="mt-1 text-sm text-zinc-600">
                Están todas en ese mismo botón, en el apartado{" "}
                <strong>Historial de facturación</strong>: se descargan en PDF, con el CIF y la
                dirección que diste al contratar. Ahí mismo puedes corregir esos datos si cambian, y
                la siguiente factura sale ya con los nuevos.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <SelectorDePlan
              plazasFundadorLibres={plazasFundadorLibres}
              textoBoton={suscripcion.status === "canceled" ? "Volver a suscribirse" : "Elegir este plan"}
            />
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Conservas todos tus datos aunque la suscripción no esté activa: solo se oculta tu página
          pública y tus oportunidades hasta que vuelvas a suscribirte. Desde &quot;Gestionar
          suscripción&quot; puedes cambiar de tarjeta, descargar tus facturas, actualizar los datos
          fiscales del club o cancelar.
        </p>
      </section>
    </div>
  );
}
