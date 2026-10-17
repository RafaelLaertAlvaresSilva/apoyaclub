"use server";

import { getTranslations } from "next-intl/server";
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
  const tValidacion = await getTranslations("auth.validacion");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = formData.get("next") ? String(formData.get("next")) : null;

  if (!email || !password) {
    return { error: tValidacion("emailYPassword") };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: await mensajeErrorAuth(error.message) };
  }

  const rol = data.user?.app_metadata?.role as Role | undefined;
  const destino = esRutaSegura(next) ? next : rol ? RUTA_POR_ROL[rol] : "/";
  const locale = await getLocale();

  // El idioma en el que se le escribirán los avisos por correo: el de
  // la página desde la que entra. Si falla no pasa nada, se queda el
  // que tuviera; no es motivo para no dejarle entrar.
  if (data.user && data.user.user_metadata?.idioma !== locale) {
    await supabase.auth.updateUser({ data: { idioma: locale } }).catch(() => undefined);
  }

  return redirect({ href: destino, locale });
}
