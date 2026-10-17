import { useTranslations } from "next-intl";
import { useIntlLocale } from "@/i18n/use-intl-locale";
import { Link } from "@/i18n/navigation";
import { diasDePruebaQueQuedan } from "@/lib/acceso-club";
import type { ClubSubscription } from "@/lib/subscription-mappers";

function formatearFecha(fechaIso: string, intlLocale: string): string {
  return new Date(fechaIso).toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Aviso persistente en la parte superior del panel (Fase 10) cuando la
 * suscripción necesita atención: sin empezar, cancelada, con el cobro
 * pendiente, o activa pero con una cancelación programada. No se
 * muestra si la suscripción está activa sin cancelación pendiente (ese
 * caso ya se ve con detalle en "Suscripción").
 *
 * La prueba sí avisa, pero solo en su última semana. Antes no decía
 * nada en ninguna parte: el club trabajaba tranquilo y el día que se
 * acababa lo echaba a la página de pago sin haberlo visto venir. Un
 * corte sin preaviso se vive como una trampa, y es justo el momento en
 * el que hay que pedirle la tarjeta.
 */
export const DIAS_PARA_AVISAR_DEL_FIN = 7;
export function AvisoSuscripcion({ suscripcion }: { suscripcion: ClubSubscription }) {
  const intlLocale = useIntlLocale();
  const t = useTranslations("panel.perfil2");
  const { status, cancelAtPeriodEnd, currentPeriodEnd } = suscripcion;

  let mensaje: string | null = null;
  let grave = false;

  if (status === null) {
    mensaje = t("avisoSuscripcion.sinActivar");
    grave = true;
  } else if (status === "canceled") {
    mensaje = t("avisoSuscripcion.terminada");
    grave = true;
  } else if (status === "past_due" || status === "unpaid") {
    mensaje = t("avisoSuscripcion.problemaCobro");
    grave = true;
  } else if (status === "incomplete" || status === "incomplete_expired") {
    mensaje = t("avisoSuscripcion.pagoIncompleto");
    grave = true;
  } else if ((status === "active" || status === "trialing") && cancelAtPeriodEnd && currentPeriodEnd) {
    mensaje = t("avisoSuscripcion.cancelada", { fecha: formatearFecha(currentPeriodEnd, intlLocale) });
    grave = false;
  } else if (status === "trialing" && suscripcion.trialEndsAt) {
    // Con `trialEndsAt` a null no se sabe cuándo acaba, y
    // `diasDePruebaQueQuedan` devuelve 0 para eso igual que para "se
    // acaba hoy". Sin la comprobación, un club sin fecha vería todos los
    // días que hoy es el último.
    const dias = diasDePruebaQueQuedan(suscripcion.trialEndsAt);

    if (dias === 0) {
      mensaje = t("avisoSuscripcion.ultimoDia");
      grave = false;
    } else if (dias <= DIAS_PARA_AVISAR_DEL_FIN) {
      mensaje = t("avisoSuscripcion.quedanDias", { dias });
      grave = false;
    }
  }

  if (!mensaje) return null;

  return (
    <div
      role="status"
      className={`px-4 py-2.5 text-center text-sm font-medium ${
        grave ? "bg-peligro text-sobre-color" : "bg-aviso text-sobre-aviso"
      }`}
    >
      {mensaje}{" "}
      <Link href="/panel/suscripcion" className="underline underline-offset-2">{t("verSuscripcion")}</Link>
    </div>
  );
}
