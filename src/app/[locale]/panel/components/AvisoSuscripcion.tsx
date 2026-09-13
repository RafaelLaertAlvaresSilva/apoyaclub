import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { diasDePruebaQueQuedan } from "@/lib/acceso-club";
import type { ClubSubscription } from "@/lib/subscription-mappers";

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-ES", {
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
  const t = useTranslations("panel.perfil2");
  const { status, cancelAtPeriodEnd, currentPeriodEnd } = suscripcion;

  let mensaje: string | null = null;
  let grave = false;

  if (status === null) {
    mensaje =
      "Todavía no has activado tu suscripción. Mientras tanto, tu página pública y tus oportunidades no son visibles para las empresas.";
    grave = true;
  } else if (status === "canceled") {
    mensaje = "Tu suscripción ha terminado. Tu página pública y tus oportunidades ya no son visibles.";
    grave = true;
  } else if (status === "past_due" || status === "unpaid") {
    mensaje = "Hay un problema con el cobro de tu suscripción. Actualiza tu método de pago para no perder visibilidad.";
    grave = true;
  } else if (status === "incomplete" || status === "incomplete_expired") {
    mensaje = "No se ha podido completar el pago de tu suscripción.";
    grave = true;
  } else if ((status === "active" || status === "trialing") && cancelAtPeriodEnd && currentPeriodEnd) {
    mensaje = `Has cancelado tu suscripción: conservarás el acceso hasta el ${formatearFecha(currentPeriodEnd)}.`;
    grave = false;
  } else if (status === "trialing" && suscripcion.trialEndsAt) {
    // Con `trialEndsAt` a null no se sabe cuándo acaba, y
    // `diasDePruebaQueQuedan` devuelve 0 para eso igual que para "se
    // acaba hoy". Sin la comprobación, un club sin fecha vería todos los
    // días que hoy es el último.
    const dias = diasDePruebaQueQuedan(suscripcion.trialEndsAt);

    if (dias === 0) {
      mensaje = "Hoy es el último día de tu prueba. Mañana necesitarás una suscripción para seguir usando el panel.";
      grave = false;
    } else if (dias <= DIAS_PARA_AVISAR_DEL_FIN) {
      mensaje = `Te ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`} de prueba. Cuando termine necesitarás una suscripción para seguir usando el panel.`;
      grave = false;
    }
  }

  if (!mensaje) return null;

  return (
    <div
      role="status"
      className={`px-4 py-2.5 text-center text-sm font-medium ${
        grave ? "bg-red-600 text-white" : "bg-amber-500 text-amber-950"
      }`}
    >
      {mensaje}{" "}
      <Link href="/panel/suscripcion" className="underline underline-offset-2">{t("verSuscripcion")}</Link>
    </div>
  );
}
