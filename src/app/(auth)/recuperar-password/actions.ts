"use server";

import { headers } from "next/headers";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type EstadoRecuperar = { error?: string; enviado?: boolean } | null;

export async function solicitarRecuperacion(
  _estadoPrevio: EstadoRecuperar,
  formData: FormData,
): Promise<EstadoRecuperar> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Indica tu correo electrónico." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/actualizar-password`,
  });

  // Por seguridad, no revelamos si el correo existe o no en el sistema:
  // solo distinguimos errores de formato o de límite de intentos.
  if (error && !error.message.toLowerCase().includes("unable to validate")) {
    if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("security purposes")) {
      return { error: mensajeErrorAuth(error.message) };
    }
  }

  return { enviado: true };
}
