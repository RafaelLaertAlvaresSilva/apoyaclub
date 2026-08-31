"use server";

import { enviarEmailContactoLanding } from "@/lib/email/resend";

export type EstadoContacto = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

/**
 * Formulario de contacto de la landing (Fase 13): consultas generales de
 * cualquier visitante, no necesariamente registrado. A diferencia de la
 * solicitud de contacto club-empresa (Fase 8), aquí no hay sesión ni
 * tabla propia: solo se manda un email al equipo de ApoyaClub (variable
 * `CONTACT_EMAIL`), con la dirección del remitente como `replyTo` para
 * poder responderle directamente. Igual que el resto de envíos de email
 * de la aplicación, si `RESEND_API_KEY`/`RESEND_FROM_EMAIL` no están
 * configuradas el mensaje simplemente no llega (ver `lib/email/resend.ts`)
 * y aquí se lo hacemos saber a quien lo envía en vez de fingir éxito.
 */
export async function enviarConsultaContacto(
  _estadoPrevio: EstadoContacto,
  formData: FormData,
): Promise<EstadoContacto> {
  const nombre = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensaje = String(formData.get("message") ?? "").trim();

  if (!nombre) return { error: "Escribe tu nombre." };
  if (!email || !email.includes("@")) return { error: "Escribe un email válido." };
  if (!mensaje || mensaje.length < 10) return { error: "Cuéntanos brevemente en qué podemos ayudarte." };

  const destinatario = process.env.CONTACT_EMAIL;
  if (!destinatario) {
    console.warn("[contact] CONTACT_EMAIL no configurada: el mensaje no se ha podido enviar.");
    return { error: "El formulario de contacto no está disponible ahora mismo. Escríbenos por email." };
  }

  const resultado = await enviarEmailContactoLanding({ destinatario, nombre, email, mensaje });

  if (!resultado.ok) {
    return { error: "No se ha podido enviar tu mensaje. Inténtalo de nuevo en unos minutos." };
  }

  return { ok: true };
}
