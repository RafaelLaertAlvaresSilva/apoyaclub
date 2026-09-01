"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EstadoRegistroAdmin = { error: string } | null;

/**
 * Alta de una cuenta con rol "admin" (Fase 12). A diferencia de
 * `registro-club`/`registro-empresa`, no hay ningún enlace público a
 * esta página: solo se puede crear una cuenta si se conoce, además del
 * email y la contraseña, la clave `ADMIN_SIGNUP_KEY` (variable de
 * entorno, nunca en el código ni en el cliente). El rol se asigna igual
 * que en el resto de registros: en `app_metadata`, con la clave de
 * servicio, así que el propio usuario no puede tocarlo.
 */
export async function registrarAdmin(
  _estadoPrevio: EstadoRegistroAdmin,
  formData: FormData,
): Promise<EstadoRegistroAdmin> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");
  const claveAdmin = String(formData.get("claveAdmin") ?? "");

  const claveEsperada = process.env.ADMIN_SIGNUP_KEY;

  if (!nombre) {
    return { error: "Indica tu nombre." };
  }
  if (!email) {
    return { error: "Indica un correo electrónico." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirmarPassword) {
    return { error: "Las contraseñas no coinciden." };
  }
  // Mismo mensaje tanto si la clave configurada falta como si la
  // introducida no coincide: no hay que dar pistas de cuál es el caso.
  if (!claveEsperada || claveAdmin !== claveEsperada) {
    return { error: "Clave de administrador incorrecta." };
  }

  const origin = (await headers()).get("origin");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: nombre, role: "admin" },
      emailRedirectTo: `${origin}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: mensajeErrorAuth(error.message) };
  }

  // El rol se guarda en app_metadata (solo modificable con la clave de
  // servicio) para que no pueda alterarlo el propio usuario.
  if (data.user) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(data.user.id, {
        app_metadata: { role: "admin" },
      });
    } catch {
      return {
        error:
          "Tu cuenta se ha creado, pero ha habido un problema técnico. Contacta con soporte.",
      };
    }
  }

  return redirect({ href: "/revisa-tu-correo", locale });
}
