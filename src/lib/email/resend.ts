import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { direccionDe, limpiarCabecera } from "@/lib/email/cabeceras";
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
  remitenteNombre,
}: {
  to: string;
  subject: string;
  html: string;
  /**
   * Nombre que se ve como remitente, manteniendo la dirección de envío.
   * Lo usa el aviso al patrocinador, que sale a nombre del club: la
   * relación previa es entre el club y su empresa, no entre la empresa y
   * ApoyaClub, y el correo tiene que reflejar eso.
   */
  remitenteNombre?: string;
  /** Fase 13: para que quien recibe el email (p. ej. el equipo de
   * ApoyaClub al leer el formulario de contacto de la landing) pueda
   * responder directamente a la persona que escribió, en vez de a
   * `RESEND_FROM_EMAIL`. */
  replyTo?: string;
}): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromConfigurado = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromConfigurado) {
    console.warn(
      "[email] RESEND_API_KEY o RESEND_FROM_EMAIL no configuradas: el email no se ha enviado (pendiente de configurar).",
    );
    return { ok: false, error: "Envío de email no configurado todavía." };
  }

  const from = remitenteNombre
    ? `${limpiarCabecera(remitenteNombre)} <${direccionDe(fromConfigurado)}>`
    : fromConfigurado;

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
  personaNombre,
  personaCorreo,
  personaTelefono,
  opportunityTitle,
  message,
  panelUrl,
  responderA,
}: {
  clubEmail: string;
  clubName: string;
  /** Nombre de la empresa, o el de quien escribe si no dio empresa. */
  companyName: string;
  personaNombre: string | null;
  personaCorreo: string | null;
  personaTelefono: string | null;
  /** Título de la oportunidad, o null si la solicitud es sobre el club en general. */
  opportunityTitle: string | null;
  message: string;
  panelUrl: string;
  /**
   * Correo de quien escribió, para que el club pueda darle a
   * "Responder" y le llegue a esa persona y no a ApoyaClub. Desde que
   * no hay cuentas de empresa (migración 0034) esto es lo que hace que
   * la solicitud sirva de algo.
   */
  responderA?: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const detalles = [
    [t("solicitudContacto.persona"), personaNombre],
    [t("solicitudContacto.correo"), personaCorreo],
    [t("solicitudContacto.telefono"), personaTelefono],
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
    replyTo: responderA,
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

// ---------------------------------------------------------------------
// Emails del ciclo de vida (migración 0013)
//
// Los cuatro que faltaban para que el ciclo se sostenga solo: dar la
// bienvenida, avisar a la empresa de que el club ha respondido,
// recordar al club las solicitudes que se le quedan sin abrir, y avisar
// de que se acaba el mes gratis. Todos comparten la misma plantilla
// mínima en HTML del resto del archivo.
// ---------------------------------------------------------------------

/** Envoltura común: eyebrow de color, titular, cuerpo y un botón. */
function plantilla({
  color,
  eyebrow,
  titulo,
  cuerpo,
  botonTexto,
  botonUrl,
  pie,
}: {
  color: string;
  eyebrow: string;
  titulo: string;
  cuerpo: string;
  botonTexto: string;
  botonUrl: string;
  pie?: string;
}): string {
  return `
    <div style="font-family:sans-serif;color:#18181b;max-width:560px;margin:0 auto;">
      <p style="color:${color};font-weight:600;font-size:14px;margin:0 0 8px;">${eyebrow}</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${titulo}</h1>
      ${cuerpo}
      <a href="${botonUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">${botonTexto}</a>
      ${pie ? `<p style="color:#a1a1aa;font-size:12px;margin-top:24px;">${pie}</p>` : ""}
    </div>
  `;
}

/** Bienvenida al club, con los tres pasos que dejan su página presentable. */
export async function enviarEmailBienvenidaClub({
  clubEmail,
  clubName,
  panelUrl,
}: {
  clubEmail: string;
  clubName: string;
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const cuerpo = `
    <p style="margin:0 0 16px;">${t("bienvenidaClub.texto")}</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#3f3f46;line-height:1.7;">
      <li>${t("bienvenidaClub.paso1")}</li>
      <li>${t("bienvenidaClub.paso2")}</li>
      <li>${t("bienvenidaClub.paso3")}</li>
    </ol>
  `;

  return enviarEmail({
    to: clubEmail,
    subject: t("bienvenidaClub.asunto", { club: clubName }),
    html: plantilla({
      color: "#047857",
      eyebrow: t("bienvenidaClub.eyebrow"),
      titulo: t("bienvenidaClub.titulo", { club: clubName }),
      cuerpo,
      botonTexto: t("bienvenidaClub.boton"),
      botonUrl: panelUrl,
      pie: t("bienvenidaClub.pie"),
    }),
  });
}

/** Bienvenida a la empresa: acceso gratuito y buscador. */
export async function enviarEmailBienvenidaEmpresa({
  companyEmail,
  buscarUrl,
}: {
  companyEmail: string;
  buscarUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  return enviarEmail({
    to: companyEmail,
    subject: t("bienvenidaEmpresa.asunto"),
    html: plantilla({
      color: "#047857",
      eyebrow: t("bienvenidaEmpresa.eyebrow"),
      titulo: t("bienvenidaEmpresa.titulo"),
      cuerpo: `<p style="margin:0 0 24px;">${t("bienvenidaEmpresa.texto")}</p>`,
      botonTexto: t("bienvenidaEmpresa.boton"),
      botonUrl: buscarUrl,
      pie: t("bienvenidaEmpresa.pie"),
    }),
  });
}

/**
 * Aviso a la empresa de que el club ha movido su solicitud. Solo se
 * manda en los dos cambios que le importan: cuando el club abre la
 * conversación y cuando la descarta. Que te digan que no también es una
 * respuesta, y evita que la empresa se quede esperando.
 */
export async function enviarEmailRespuestaDelClub({
  companyEmail,
  clubName,
  clubUrl,
  buscarUrl,
  opportunityTitle,
  aceptada,
}: {
  companyEmail: string;
  clubName: string;
  clubUrl: string;
  buscarUrl: string;
  opportunityTitle: string | null;
  /** true = el club ha abierto la conversación; false = la ha descartado. */
  aceptada: boolean;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const cuerpo = `
    ${
      opportunityTitle
        ? `<p style="margin:0 0 16px;">${t("respuestaDelClub.sobreOportunidad")} <strong>${opportunityTitle}</strong></p>`
        : ""
    }
    <p style="margin:0 0 24px;">${
      aceptada ? t("respuestaDelClub.textoConversacion") : t("respuestaDelClub.textoDescartada")
    }</p>
  `;

  return enviarEmail({
    to: companyEmail,
    subject: aceptada
      ? t("respuestaDelClub.asuntoConversacion", { club: clubName })
      : t("respuestaDelClub.asuntoDescartada", { club: clubName }),
    html: plantilla({
      color: aceptada ? "#047857" : "#b45309",
      eyebrow: t("respuestaDelClub.eyebrow"),
      titulo: aceptada
        ? t("respuestaDelClub.tituloConversacion", { club: clubName })
        : t("respuestaDelClub.tituloDescartada", { club: clubName }),
      cuerpo,
      botonTexto: aceptada ? t("respuestaDelClub.botonConversacion") : t("respuestaDelClub.botonDescartada"),
      botonUrl: aceptada ? clubUrl : buscarUrl,
    }),
  });
}

/** Recordatorio al club de las solicitudes que lleva sin abrir. */
export async function enviarEmailSolicitudSinAbrir({
  clubEmail,
  total,
  diasDeLaMasAntigua,
  panelUrl,
}: {
  clubEmail: string;
  total: number;
  diasDeLaMasAntigua: number;
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  return enviarEmail({
    to: clubEmail,
    subject: t("solicitudSinAbrir.asunto", { total }),
    html: plantilla({
      color: "#b45309",
      eyebrow: t("solicitudSinAbrir.eyebrow"),
      titulo: t("solicitudSinAbrir.titulo", { total }),
      cuerpo: `<p style="margin:0 0 24px;">${t("solicitudSinAbrir.texto", { dias: diasDeLaMasAntigua })}</p>`,
      botonTexto: t("solicitudSinAbrir.boton"),
      botonUrl: panelUrl,
    }),
  });
}

/**
 * Agradecimiento del club a una empresa que ya le patrocina, con el
 * enlace a su página (migración 0027).
 *
 * Sale a nombre del club y con su correo para responder, no a nombre de
 * ApoyaClub: la relación previa que lo justifica es la del club con su
 * patrocinador. El pie dice quién escribe, por qué llega y que no habrá
 * un segundo correo.
 */
export async function enviarEmailAvisoPatrocinador({
  empresaEmail,
  clubNombre,
  urlFicha,
  responderA,
}: {
  empresaEmail: string;
  clubNombre: string;
  urlFicha: string;
  /** Correo del club, para que la empresa le conteste a él. */
  responderA?: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  return enviarEmail({
    to: empresaEmail,
    replyTo: responderA,
    remitenteNombre: clubNombre,
    subject: t("avisoPatrocinador.asunto", { club: clubNombre }),
    html: plantilla({
      color: "#047857",
      eyebrow: t("avisoPatrocinador.eyebrow"),
      titulo: t("avisoPatrocinador.titulo", { club: clubNombre }),
      cuerpo: [
        `<p style="margin:0 0 16px;">${t("avisoPatrocinador.texto", { club: clubNombre })}</p>`,
        `<p style="margin:0 0 24px;">${t("avisoPatrocinador.texto2")}</p>`,
      ].join(""),
      botonTexto: t("avisoPatrocinador.boton"),
      botonUrl: urlFicha,
      pie: t("avisoPatrocinador.pieMotivo", { club: clubNombre }),
    }),
  });
}

/**
 * Aviso de que la ficha del club está a medias (migración 0020).
 *
 * No es un correo de marketing: el porcentaje de ficha rellenada entra
 * de verdad en el orden del buscador, así que esto le está diciendo al
 * club por qué no le encuentran, con los tres huecos concretos que más
 * le penalizan.
 */
export async function enviarEmailFichaIncompleta({
  clubEmail,
  clubName,
  porcentaje,
  huecos,
  panelUrl,
}: {
  clubEmail: string;
  clubName: string;
  porcentaje: number;
  /** Títulos de lo que le falta, ya priorizados. */
  huecos: string[];
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  const lista = huecos
    .map(
      (hueco) =>
        `<li style="margin:0 0 8px;">${hueco.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</li>`,
    )
    .join("");

  return enviarEmail({
    to: clubEmail,
    subject: t("fichaIncompleta.asunto", { porcentaje }),
    html: plantilla({
      color: "#b45309",
      eyebrow: t("fichaIncompleta.eyebrow"),
      titulo: t("fichaIncompleta.titulo", { club: clubName, porcentaje }),
      cuerpo: [
        `<p style="margin:0 0 12px;">${t("fichaIncompleta.texto")}</p>`,
        `<ul style="margin:0 0 20px;padding-left:20px;color:#3f3f46;">${lista}</ul>`,
        `<p style="margin:0 0 24px;">${t("fichaIncompleta.cierre")}</p>`,
      ].join(""),
      botonTexto: t("fichaIncompleta.boton"),
      botonUrl: panelUrl,
    }),
  });
}

/**
 * Aviso de que se acaba el mes gratis. Distinto del de caducidad: aquí
 * el club no ha cancelado nada, simplemente va a empezar a pagar, y lo
 * honesto es decírselo antes de cobrar.
 */
export async function enviarEmailFinDePrueba({
  clubEmail,
  clubName,
  diasRestantes,
  fechaFin,
  panelUrl,
}: {
  clubEmail: string;
  clubName: string;
  diasRestantes: number;
  fechaFin: string;
  panelUrl: string;
}): Promise<ResultadoEnvioEmail> {
  const t = await traductorEmails();

  return enviarEmail({
    to: clubEmail,
    subject: t("finDePrueba.asunto", { dias: diasRestantes }),
    html: plantilla({
      color: "#047857",
      eyebrow: t("finDePrueba.eyebrow"),
      titulo: t("finDePrueba.titulo", { dias: diasRestantes, club: clubName }),
      cuerpo: `<p style="margin:0 0 24px;">${t("finDePrueba.texto", { fecha: fechaFin })}</p>`,
      botonTexto: t("finDePrueba.boton"),
      botonUrl: panelUrl,
    }),
  });
}
