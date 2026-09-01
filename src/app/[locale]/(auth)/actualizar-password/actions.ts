"use server";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type EstadoActualizar = { error: string } | null;

export async function actualizarPassword(
  _estadoPrevio: EstadoActualizar,
  formData: FormData,
): Promise<EstadoActualizar> {
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirmarPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "El enlace ha caducado o no es válido. Solicita uno nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: mensajeErrorAuth(error.message) };
  }

  // Cerramos la sesión temporal de recuperación: el usuario debe volver
  // a entrar con su nueva contraseña.
  await supabase.auth.signOut();

  const locale = await getLocale();
  return redirect({ href: "/login?mensaje=password-actualizada", locale });
}
