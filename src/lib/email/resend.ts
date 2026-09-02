import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
/**
 * Envío de email transaccional con Resend (Fase 8), usando `fetch`
 * directamente contra su API HTTP (https://resend.com/docs/api-reference/emails/send-email)
 * en vez de añadir su paquete como dependencia nueva.
 *
 * Aislado en este único archivo a propósito: si en el futuro cambia el
 * proveedor de email, solo hay que tocar `enviarEmail`.
 *
 * Variables de entorno (ver `.env.local.example`):
 * - `RESEND_API_KEY`: clave de API de tu cuenta de Resend.
 * - `RESEND_FROM_EMAIL`: dirección remitente verificada en Resend
 *   (mientras no verifiques un dominio propio, Resend solo deja usar
 *   `onboarding@resend.dev` como remitente, y solo entrega a la cuenta
 *   con la que te registraste — para enviar a cualquier club real hace
 *   falta verificar un dominio en Resend).
 *
 * Si no están configuradas, no se lanza ninguna excepción: la solicitud
 * de contacto se sigue creando igualmente (por eso el resultado de estas
 * funciones nunca bloquea el flujo que las llama, solo se registra el
 * aviso en el servidor).
 */

export type ResultadoEnvioEmail = { ok: true } | { ok: false; error: string };

export async function enviarEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  /** Fase 13: para que quien recibe el email (p. ej. el equipo de
   * ApoyaClub al leer el formulario de contacto de la landing) pueda
   * responder directamente a la persona que escribió, en vez de a
   * `RESEND_FROM_EMAIL`. */
  replyTo?: string;
}): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY o RESEND_FROM_EMAIL no configuradas: el email no se ha enviado (pendiente de configurar).",
    );
    return { ok: false, error: "Envío de email no configurado todavía." };
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      console.error("[email] Resend ha devuelto un error:", respuesta.status, detalle);
      return { ok: false, error: "No se ha podido enviar el email." };
    }

    return { ok: true };
  } catch (excepcion) {
    console.error("[email] Fallo al llamar a Resend:", excepcion);
    return { ok: false, error: "No se ha podido enviar el email." };
  }
}

/**
 * Traductor de los emails (Fase 14).
 *
 * Se pide con el idioma explícito en vez de heredarlo de la petición:
 * el cron de avisos (`api/cron/subscription-reminders`) no viene de
 * ninguna URL con prefijo de idioma, así que ahí no hay ninguno del que
 * heredar. Cuando existan destinatarios en otro idioma, este es el sitio
 * donde se decidirá cuál usar (por ejemplo, el idioma guardado del club).
 */
async function traductorEmails() {
  return getTranslations({ locale: routing.defaultLocale, namespace: "emails" });
}

/**
 * Email que recibe el club cuando una empresa solicita contacto (Fase 8).
 * Incluye los datos de la empresa y un enlace a su panel para responder.
 */
export async function enviarEmailNuevaSolicitudContacto({
  clubEmail,
  clubName,
  companyName,
  companySector,
  companyCity,
  companyWebsite,
  presupuestoTexto,
  opportunityTitle,
  message,
  panelUrl,
}: {
  clubEmail: string;
  clubName: string;
  companyName: string;
  companySector: string | null;
  companyCity: string | null;
  companyWebsite: string | null;
  presupuestoTexto: string | null;
  /** Título de la oportunidad, o null si la solicitud es sobre el club en general. */
  opportunityTitle: string | null;
  message: string;
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const detalles = [
    [t("solicitudContacto.sector"), companySector],
    [t("solicitudContacto.localidad"), companyCity],
    [t("solicitudContacto.web"), companyWebsite],
    [t("solicitudContacto.presupuesto"), presupuestoTexto],
  ].filter(([, valor]) => Boolean(valor));

  const filasDetalle = detalles
    .map(
      ([etiqueta, valor]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#52525b;">${etiqueta}</td><td style="padding:4px 0;color:#18181b;">${valor}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#047857;font-weight:600;font-size:14px;margin:0 0 8px;">${t("solicitudContacto.eyebrow")}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${t("solicitudContacto.titulo", { empresa: companyName, club: clubName })}</h1>
      ${
        opportunityTitle
          ? `<p style="margin:0 0 16px;">${t("solicitudContacto.sobreOportunidad")} <strong>${opportunityTitle}</strong></p>`
          : `<p style="margin:0 0 16px;">${t("solicitudContacto.sobreElClub")}</p>`
      }
      ${filasDetalle ? `<table style="border-collapse:collapse;margin:0 0 16px;font-size:14px;">${filasDetalle}</table>` : ""}
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:0 0 24px;white-space:pre-line;">${message}</div>
      <a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">${t("solicitudContacto.boton")}</a>
      <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">
        ${t("solicitudContacto.pie")}
      </p>
    </div>
  `;

  return enviarEmail({
    to: clubEmail,
    subject: t("solicitudContacto.asunto", { empresa: companyName }),
    html,
  });
}

/**
 * Aviso de que la suscripción del club está a punto de caducar (Fase
 * 10): solo se envía cuando el club ha cancelado (cancelación
 * programada al final del periodo ya pagado), a 7, 3 y 1 día antes de
 * esa fecha. Lo dispara el cron `api/cron/subscription-reminders`.
 */
export async function enviarEmailAvisoCaducidadSuscripcion({
  clubEmail,
  clubName,
  diasRestantes,
  fechaFin,
  panelUrl,
}: {
  clubEmail: string;
  clubName: string;
  diasRestantes: 7 | 3 | 1;
  /** Fecha ya formateada para mostrar (p. ej. "15 de marzo de 2026"). */
  fechaFin: string;
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#b91c1c;font-weight:600;font-size:14px;margin:0 0 8px;">${t("caducidadSuscripcion.eyebrow")}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${t("caducidadSuscripcion.titulo", { dias: diasRestantes, club: clubName })}</h1>
      <p style="margin:0 0 16px;">${t("caducidadSuscripcion.texto", { fecha: fechaFin })}</p>
      <p style="margin:0 0 24px;">${t("caducidadSuscripcion.texto2")}</p>
      <a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">${t("caducidadSuscripcion.boton")}</a>
    </div>
  `;

  return enviarEmail({
    to: clubEmail,
    subject: t("caducidadSuscripcion.asunto", { dias: diasRestantes }),
    html,
  });
}

/**
 * Email al equipo de ApoyaClub cuando alguien envía el formulario de
 * contacto de la landing (Fase 13): consultas generales de un visitante
 * (club, empresa o cualquier otra persona) que todavía no tiene cuenta,
 * así que no encaja en el flujo de solicitud de contacto club-empresa
 * de `enviarEmailNuevaSolicitudContacto`. No se guarda en base de
 * datos: solo se envía este email, con `replyTo` puesto al remitente
 * para poder responderle directamente.
 */
export async function enviarEmailContactoLanding({
  destinatario,
  nombre,
  email,
  mensaje,
}: {
  destinatario: string;
  nombre: string;
  email: string;
  mensaje: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#047857;font-weight:600;font-size:14px;margin:0 0 8px;">${t("contactoLanding.eyebrow")}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${nombre}</h1>
      <p style="margin:0 0 16px;color:#52525b;">${email}</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;white-space:pre-line;">${mensaje}</div>
    </div>
  `;

  return enviarEmail({
    to: destinatario,
    subject: t("contactoLanding.asunto", { nombre }),
    html,
    replyTo: email,
  });
}
