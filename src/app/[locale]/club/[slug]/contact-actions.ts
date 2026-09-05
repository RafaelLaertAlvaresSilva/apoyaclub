"use server";

import { getLocale } from "next-intl/server";
import { enviarEmailNuevaSolicitudContacto } from "@/lib/email/resend";
import { avisarDeFallo } from "@/lib/monitoring";
import { consumirLimite, ipDelVisitante, pareceBot } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoSolicitud = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

/**
 * Solicitud de contacto de una empresa a un club, sin necesidad de
 * cuenta (migración 0034).
 *
 * Antes hacía falta registrarse como empresa. Se quitó: cada paso entre
 * la empresa y el club era un patrocinio menos, y quien entra en la
 * ficha de un club a las once de la noche no se abre una cuenta, se va.
 *
 * La fila la escribe el servidor con la clave de servicio, nunca el
 * navegador: dejar insertar en `contact_requests` desde fuera sería
 * abrir un buzón de spam para todos los clubes a la vez. El control de
 * abuso está aquí — campo trampa y tope por IP.
 */
export async function crearSolicitudContacto(
  _estadoPrevio: EstadoSolicitud,
  formData: FormData,
): Promise<EstadoSolicitud> {
  // Campo trampa: lo rellenan los robots y nadie más. Se devuelve "ok"
  // a propósito, para que quien lo hizo no aprenda que le han pillado.
  //
  // Pero queda apuntado en el servidor. Sin esta línea, un formulario
  // que se descarta por la trampa es indistinguible de uno que se
  // envió bien: la persona ve "mensaje enviado" y al club no le llega
  // nada. Ha pasado, y sin rastro no hay forma de saberlo.
  if (pareceBot(formData)) {
    console.warn(
      "[solicitud] Descartada por el campo trampa. Si esto le ha pasado a una persona real, " +
        "probablemente se lo rellenó el autocompletado del navegador.",
    );
    return { ok: true };
  }

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const clubId = texto("clubId");
  const mensaje = texto("message");
  const nombre = texto("nombre");
  const empresa = texto("empresa");
  const correo = texto("correo");
  const telefono = texto("telefono");
  const opportunityId = texto("opportunityId") || null;

  if (!clubId) return { error: "Club no encontrado." };
  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return { error: "Escribe un correo válido: es a donde te contestará el club." };
  }
  if (mensaje.length < 10) return { error: "Escribe un mensaje para el club." };
  if (mensaje.length > 2000) return { error: "El mensaje es demasiado largo." };

  // Una persona real no manda diez solicitudes en una hora. Por IP,
  // que es lo único que hay cuando no hay cuenta.
  const cupo = await consumirLimite({
    bucket: "solicitud-contacto",
    identificador: await ipDelVisitante(),
    limite: 10,
    ventanaSegundos: 3600,
  });

  if (!cupo) {
    return { error: "Has enviado muchas solicitudes seguidas. Espera un rato y vuelve a intentarlo." };
  }

  const admin = createAdminClient();

  const { error } = await admin.from("contact_requests").insert({
    club_id: clubId,
    opportunity_id: opportunityId,
    message: mensaje,
    sender_name: nombre.slice(0, 120),
    sender_company: empresa ? empresa.slice(0, 120) : null,
    sender_email: correo.slice(0, 200),
    sender_phone: telefono ? telefono.slice(0, 40) : null,
  });

  if (error) {
    avisarDeFallo("email", "No se ha podido crear la solicitud de contacto", error);

    // En desarrollo se dice el motivo técnico. Un "inténtalo de nuevo"
    // a secas obliga a adivinar, y casi siempre lo que falla es algo
    // concreto y arreglable: una migración sin aplicar, un permiso.
    const motivo =
      process.env.NODE_ENV !== "production" && error.message
        ? ` (motivo técnico: ${error.message})`
        : "";

    return { error: `No se ha podido enviar la solicitud. Inténtalo de nuevo.${motivo}` };
  }

  console.log(`[solicitud] Creada para el club ${clubId}, de ${nombre} <${correo}>.`);

  // El correo es un extra: si falla, la solicitud ya está creada y el
  // club la verá igual en su panel. Pero se deja constancia de si salió
  // o no, que es la pregunta que se hace uno cuando "no llega nada".
  await notificarClubPorEmail({
    clubId,
    opportunityId,
    mensaje,
    nombre,
    empresa,
    correo,
    telefono,
  });

  return { ok: true };
}

async function notificarClubPorEmail({
  clubId,
  opportunityId,
  mensaje,
  nombre,
  empresa,
  correo,
  telefono,
}: {
  clubId: string;
  opportunityId: string | null;
  mensaje: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
}) {
  try {
    const admin = createAdminClient();

    const [clubAuth, { data: clubRow }] = await Promise.all([
      admin.auth.admin.getUserById(clubId),
      admin.from("clubs").select("name, contact_email").eq("id", clubId).maybeSingle<{
        name: string;
        contact_email: string | null;
      }>(),
    ]);

    // Al correo que el club publicó si lo hay, y si no al de su cuenta.
    const clubEmail = clubRow?.contact_email ?? clubAuth.data.user?.email;
    if (!clubEmail) return;

    let opportunityTitle: string | null = null;
    if (opportunityId) {
      const { data } = await admin
        .from("opportunities")
        .select("title")
        .eq("id", opportunityId)
        .maybeSingle<{ title: string }>();
      opportunityTitle = data?.title ?? null;
    }

    const resultado = await enviarEmailNuevaSolicitudContacto({
      clubEmail,
      clubName: clubRow?.name ?? "tu club",
      companyName: empresa || nombre,
      personaNombre: nombre,
      personaCorreo: correo,
      personaTelefono: telefono || null,
      opportunityTitle,
      message: mensaje,
      panelUrl: `${SITE_URL}/${await getLocale()}/panel/solicitudes`,
      // Para que el club conteste con "Responder" y le llegue a quien
      // escribió, no a ApoyaClub.
      responderA: correo,
    });

    if (resultado.ok) {
      console.log(`[solicitud] Aviso enviado al club (${clubEmail}).`);
    } else {
      console.warn(`[solicitud] El aviso al club NO ha salido: ${resultado.error}`);
    }
  } catch (excepcion) {
    avisarDeFallo("email", "No se ha podido notificar al club por email", excepcion);
  }
}
