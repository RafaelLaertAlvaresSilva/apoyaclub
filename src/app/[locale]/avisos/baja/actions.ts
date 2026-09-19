"use server";

import { avisarDeFallo } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoBaja = { error: string } | { ok: true } | null;

/**
 * Deja de mandar avisos a quien lo pide desde el correo.
 *
 * Va con la clave de servicio a propósito: aquí no hay sesión ninguna,
 * y esa es toda la gracia. Obligar a recordar la contraseña para dejar
 * de recibir correos es la forma más rápida de que te marquen como
 * spam, que hace mucho más daño que perder un suscriptor.
 *
 * La llave solo sirve para apagar los avisos de esa empresa. No abre su
 * cuenta, no enseña sus datos y no se puede usar para encenderlos otra
 * vez: eso se hace desde el panel, con la sesión iniciada.
 */
export async function darseDeBajaDeAvisos(formData: FormData): Promise<EstadoBaja> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "Este enlace no es válido." };

  const { error, count } = await createAdminClient()
    .from("companies")
    .update({ alerts_enabled: false }, { count: "exact" })
    .eq("unsubscribe_token", token);

  if (error) {
    avisarDeFallo("empresa", "No se ha podido dar de baja de los avisos", error);
    return { error: "No se ha podido completar. Inténtalo dentro de un rato." };
  }

  // Un enlace viejo o manipulado no encuentra a nadie. Se dice, en vez
  // de fingir que ha funcionado: si alguien sigue recibiendo correos
  // después de darse de baja, lo siguiente es el botón de spam.
  if (!count) return { error: "Este enlace ya no sirve. Escríbenos a info@apoyaclub.com." };

  return { ok: true };
}
