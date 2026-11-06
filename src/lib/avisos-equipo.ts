import { enviarEmail } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/site";

/**
 * Avisos para el equipo de ApoyaClub (pedido por Rafael el 6-11-2026):
 * un correo a `CONTACT_EMAIL` (info@apoyaclub.com, que llega al Gmail de
 * Rafael) cada vez que pasa algo que conviene saber al momento:
 *
 *   - un club se registra;
 *   - un club elige plan y deja su tarjeta;
 *   - se cobra el primer recibo de un club (fin de la prueba gratis);
 *   - falla un cobro;
 *   - un club cancela o se le acaba la suscripción;
 *   - una empresa escribe a un club.
 *
 * Nunca bloquea lo que lo llama: si el correo no sale, se apunta en el
 * registro del servidor y ya está. En español, como el resto del
 * administrador.
 */
export type AvisoEquipo = {
  /** Lo que se lee en la bandeja de entrada: "🎉 Primer cobro: CD Maciot Sport". */
  asunto: string;
  /** Una línea cada una: "Club: …", "Plan: …". */
  lineas: (string | null | undefined | false)[];
  /** Dónde mirarlo; por defecto, Administración → Clubes. */
  enlace?: { texto: string; url: string };
};

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** El HTML del aviso. Aparte para poder probarlo sin enviar nada. */
export function htmlDelAviso({ asunto, lineas, enlace }: AvisoEquipo): string {
  const destino = enlace ?? { texto: "Abrir Administración → Clubes", url: `${SITE_URL}/es/admin/clubes` };
  const filas = lineas
    .filter((linea): linea is string => typeof linea === "string" && linea.trim() !== "")
    .map((linea) => `<li style="margin:0 0 6px;">${escapar(linea)}</li>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5;">
<p style="font-size:17px;font-weight:bold;margin:0 0 12px;">${escapar(asunto)}</p>
<ul style="padding-left:18px;margin:0 0 16px;">${filas}</ul>
<p style="margin:0 0 16px;"><a href="${escapar(destino.url)}" style="color:#0f766e;font-weight:bold;">${escapar(destino.texto)}</a></p>
<p style="font-size:12px;color:#6b7280;margin:0;">Aviso automático de ApoyaClub para el equipo.</p>
</div>`;
}

export async function avisarAlEquipo(aviso: AvisoEquipo): Promise<void> {
  const destinatario = process.env.CONTACT_EMAIL;
  if (!destinatario) {
    console.warn("[avisos-equipo] CONTACT_EMAIL no configurada:", aviso.asunto);
    return;
  }
  try {
    const resultado = await enviarEmail({ to: destinatario, subject: aviso.asunto, html: htmlDelAviso(aviso) });
    if (!resultado.ok) console.warn("[avisos-equipo] No se ha enviado:", aviso.asunto, resultado.error);
  } catch (excepcion) {
    console.warn("[avisos-equipo] Fallo al enviar:", aviso.asunto, excepcion);
  }
}

/** "29,90 € al mes" / "R$ 790 al año", a partir de lo que trae Stripe. */
export function importeDeStripe(
  centimos: number | null | undefined,
  moneda: string | null | undefined,
  intervalo: string | null | undefined,
): string | null {
  if (centimos == null || !moneda) return null;
  const importe = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(centimos / 100);
  const cada = intervalo === "year" ? " al año" : intervalo === "month" ? " al mes" : "";
  return `${importe}${cada}`;
}

/** "10 de abril de 2027", o null. */
export function fechaDeStripe(timestampUnix: number | null | undefined): string | null {
  if (typeof timestampUnix !== "number") return null;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(
    new Date(timestampUnix * 1000),
  );
}

export type CambioDeSuscripcion =
  | "plan-elegido"
  | "primer-cobro"
  | "cobro-fallido"
  | "cobro-recuperado"
  | "cancelada"
  | "terminada";

/**
 * Qué ha pasado en un `customer.subscription.updated`, mirando lo que
 * ha cambiado (`previous_attributes`). Null si no es nada que avisar
 * (una renovación normal, un cambio de tarjeta…).
 */
export function queHaCambiado(
  antes: { status?: string; cancel_at_period_end?: boolean },
  ahora: { status: string; cancel_at_period_end: boolean | null },
): CambioDeSuscripcion | null {
  if (antes.status !== undefined && antes.status !== ahora.status) {
    if (antes.status === "trialing" && ahora.status === "active") return "primer-cobro";
    if (ahora.status === "past_due" || ahora.status === "unpaid") return "cobro-fallido";
    if ((antes.status === "past_due" || antes.status === "unpaid") && ahora.status === "active") {
      return "cobro-recuperado";
    }
  }
  if (antes.cancel_at_period_end === false && ahora.cancel_at_period_end) return "cancelada";
  return null;
}
