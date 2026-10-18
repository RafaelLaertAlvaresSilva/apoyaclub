import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import {
  esVisiblePublicamente,
  subscriptionRowToInfo,
  type SubscriptionStatus,
  type SubscriptionRow,
} from "@/lib/subscription-mappers";
import { esAccesoRegalado } from "@/lib/acceso-gratuito";
import { createClient } from "@/lib/supabase/server";
import { intlLocaleDe } from "@/config/locales";
import { PLANES, esPlanValido, precioFormateado } from "@/lib/planes";
import { abrirPortalCliente } from "./actions";
import { SelectorDePlan } from "./components/SelectorDePlan";

/** Los `?error=` que pueden llegar de las acciones, con su texto en `errores`. */
const ERRORES_CONOCIDOS = new Set(["sesion", "checkout", "portal", "sin-suscripcion", "sin-plazas"]);

/** Los estados de Stripe que tienen texto propio; el resto es "sin suscripción". */
const ESTADOS_CONOCIDOS = new Set([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkout?: string; motivo?: string }>;
}) {
  const t = await getTranslations("panel.suscripcion");
  const tPlanes = await getTranslations("home.planes");
  const intlLocale = intlLocaleDe(await getLocale());
  const formatearFecha = (fechaIso: string) =>
    new Date(fechaIso).toLocaleDateString(intlLocale, { day: "numeric", month: "long", year: "numeric" });
  const estadoTexto = (estado: SubscriptionStatus) =>
    t(`estados.${ESTADOS_CONOCIDOS.has(estado ?? "") ? estado : "ninguno"}`);
  const { error, checkout, motivo } = await searchParams;

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
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("suscripcion")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">{t("intro")}</p>
        </div>
      </div>


      <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-6">
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
                  ? t("confirmada")
                  : t("confirmando")
              }
            />
          </div>
        )}

        {/* Le ha traído el middleware desde otra página del panel: se
            le acabó la prueba y todo lo demás está cerrado. Merece una
            explicación, no aparecer aquí sin saber por qué. */}
        {motivo === "prueba-terminada" && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">{t("pruebaTerminada")}</p>
            <p className="mt-1 text-sm text-amber-800">{t("pruebaTerminadaTexto")}</p>
          </div>
        )}

        {checkout === "cancel" && (
          <div className="mb-4">
            <AvisoError mensaje={t("pagoCancelado")} />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <AvisoError mensaje={ERRORES_CONOCIDOS.has(error) ? t(`errores.${error}`) : t("errores.inesperado")} />
          </div>
        )}

        <h2 className="text-base font-semibold text-zinc-900">
          {planActual ? t("planNombre", { nombre: tPlanes(`${planActual.id}.nombre`) }) : t("tuPlan")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {planActual
            ? `${t("precioConIva", {
                precio: precioFormateado(planActual, intlLocale),
                periodo: tPlanes(planActual.intervalo === "mes" ? "alMes" : "alAnio"),
              })}${
                planActual.id === "fundador" && filaSuscripcion?.founder_number
                  ? ` ${t("eresFundador", { numero: filaSuscripcion.founder_number })}`
                  : ""
              }`
            : t("eligeComoPagar")}
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("estado")}</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {estadoTexto(suscripcion.status)}
            </dd>
          </div>

          {suscripcion.status === "trialing" && suscripcion.currentPeriodEnd && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {invitado ? t("invitadoHasta") : t("finDeLaPrueba")}
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
                  ? ` — ${t("eseDiaSeCobra")}`
                  : invitado
                    ? ` — ${t("hastaEntoncesNada")}`
                    : ` — ${t("siNoEligesPlan")}`}
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
                {t("accesoHastaCancelada")}
              </dt>
              <dd className="mt-1 text-sm text-red-700">{formatearFecha(suscripcion.currentPeriodEnd)}</dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("visibilidadPublica")}</dt>
            <dd className="mt-1 text-sm text-zinc-700">
              {esVisiblePublicamente(suscripcion.status)
                ? t("visible")
                : t("noVisible")}
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
              <p className="text-sm font-medium text-zinc-900">{t("tusFacturas")}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {t.rich("tusFacturasTexto", { fuerte: (trozo) => <strong>{trozo}</strong> })}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {/* Al club invitado se le enseñan los planes igual, por si
                quiere pasarse a pago antes de tiempo, pero con el aviso
                delante: si no, alguien acaba metiendo una tarjeta que no
                le hacía ninguna falta y pensando que era obligatorio. */}
            {invitado && suscripcion.currentPeriodEnd && (
              <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-medium text-violet-900">
                  {t("accesoGratuitoHasta", { fecha: formatearFecha(suscripcion.currentPeriodEnd) })}
                </p>
                <p className="mt-1 text-sm text-violet-800">{t("accesoGratuitoTexto")}</p>
              </div>
            )}

            <SelectorDePlan
              plazasFundadorLibres={plazasFundadorLibres}
              textoBoton={suscripcion.status === "canceled" ? t("volverASuscribirse") : t("elegirPlan")}
            />
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          {t("conservasDatos")}
        </p>
      </section>
    </div>
  );
}
