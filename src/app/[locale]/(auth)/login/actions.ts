"use server";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

export type EstadoLogin = { error: string } | null;

function esRutaSegura(ruta: string | null): ruta is string {
  // Solo permitimos redirigir a rutas relativas propias de la app, nunca
  // a una URL externa (evita redirecciones abiertas).
  return !!ruta && ruta.startsWith("/") && !ruta.startsWith("//");
}

export async function iniciarSesion(
  _estadoPrevio: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = formData.get("next") ? String(formData.get("next")) : null;

  if (!email || !password) {
    return { error: "Indica tu correo electrónico y tu contraseña." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: mensajeErrorAuth(error.message) };
  }

  const rol = data.user?.app_metadata?.role as Role | undefined;
  const destino = esRutaSegura(next) ? next : rol ? RUTA_POR_ROL[rol] : "/";
  const locale = await getLocale();

  return redirect({ href: destino, locale });
}
