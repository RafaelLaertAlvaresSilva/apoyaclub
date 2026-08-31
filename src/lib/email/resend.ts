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
  const detalles = [
    ["Sector", companySector],
    ["Localidad", companyCity],
    ["Web", companyWebsite],
    ["Presupuesto orientativo", presupuestoTexto],
  ].filter(([, valor]) => Boolean(valor));

  const filasDetalle = detalles
    .map(
      ([etiqueta, valor]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#52525b;">${etiqueta}</td><td style="padding:4px 0;color:#18181b;">${valor}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#047857;font-weight:600;font-size:14px;margin:0 0 8px;">Nueva solicitud de contacto en ApoyaClub</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${companyName} quiere contactar con ${clubName}</h1>
      ${
        opportunityTitle
          ? `<p style="margin:0 0 16px;">Sobre la oportunidad: <strong>${opportunityTitle}</strong></p>`
          : `<p style="margin:0 0 16px;">Sobre tu club en general (sin una oportunidad concreta).</p>`
      }
      ${filasDetalle ? `<table style="border-collapse:collapse;margin:0 0 16px;font-size:14px;">${filasDetalle}</table>` : ""}
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:0 0 24px;white-space:pre-line;">${message}</div>
      <a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">Ver y responder en tu panel</a>
      <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">
        ApoyaClub solo pone en contacto a las dos partes: la conversación y cualquier acuerdo se gestionan directamente entre el club y la empresa.
      </p>
    </div>
  `;

  return enviarEmail({
    to: clubEmail,
    subject: `${companyName} quiere contactar contigo en ApoyaClub`,
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
  const dias = diasRestantes === 1 ? "1 día" : `${diasRestantes} días`;

  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#b91c1c;font-weight:600;font-size:14px;margin:0 0 8px;">Tu suscripción a ApoyaClub caduca pronto</p>
      <h1 style="font-size:20px;margin:0 0 16px;">Quedan ${dias} para que ${clubName} pierda visibilidad</h1>
      <p style="margin:0 0 16px;">
        Has cancelado tu suscripción y el ${fechaFin} perderás el acceso: tu página pública y tus
        oportunidades dejarán de ser visibles para las empresas (tus datos no se borran).
      </p>
      <p style="margin:0 0 24px;">Si ha sido un error o quieres seguir, puedes reactivarla en cualquier momento antes de esa fecha.</p>
      <a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">Gestionar mi suscripción</a>
    </div>
  `;

  return enviarEmail({
    to: clubEmail,
    subject: `Quedan ${dias} para que caduque tu suscripción a ApoyaClub`,
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
  const html = `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:#047857;font-weight:600;font-size:14px;margin:0 0 8px;">Nuevo mensaje desde el formulario de contacto de ApoyaClub</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${nombre}</h1>
      <p style="margin:0 0 16px;color:#52525b;">${email}</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;white-space:pre-line;">${mensaje}</div>
    </div>
  `;

  return enviarEmail({
    to: destinatario,
    subject: `Nuevo mensaje de contacto: ${nombre}`,
    html,
    replyTo: email,
  });
}
