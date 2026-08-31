import Link from "next/link";
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
 * muestra si la suscripción está en prueba o activa sin cancelación
 * pendiente (ese caso ya se ve con detalle en "Suscripción").
 */
export function AvisoSuscripcion({ suscripcion }: { suscripcion: ClubSubscription }) {
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
      <Link href="/panel/suscripcion" className="underline underline-offset-2">
        Ver suscripción
      </Link>
    </div>
  );
}
