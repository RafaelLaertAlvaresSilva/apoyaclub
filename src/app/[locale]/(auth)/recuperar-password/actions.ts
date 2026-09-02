"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type EstadoRecuperar = { error?: string; enviado?: boolean } | null;

export async function solicitarRecuperacion(
  _estadoPrevio: EstadoRecuperar,
  formData: FormData,
): Promise<EstadoRecuperar> {
  const tValidacion = await getTranslations("auth.validacion");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: tValidacion("email") };
  }

  const origin = (await headers()).get("origin");
  const locale = await getLocale();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${locale}/auth/callback?next=/actualizar-password`,
  });

  // Por seguridad, no revelamos si el correo existe o no en el sistema:
  // solo distinguimos errores de formato o de límite de intentos.
  if (error && !error.message.toLowerCase().includes("unable to validate")) {
    if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("security purposes")) {
      return { error: await mensajeErrorAuth(error.message) };
    }
  }

  return { enviado: true };
}
