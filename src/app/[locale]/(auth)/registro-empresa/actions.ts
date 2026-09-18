"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { registrarConsentimiento } from "@/lib/consent";
import { CONSENT_TYPES, LEGAL_VERSIONS } from "@/lib/legal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EstadoRegistro = { error: string } | null;

/**
 * Alta de una empresa.
 *
 * Lo mínimo: nombre, correo y contraseña. Ni sector, ni provincia, ni
 * presupuesto — eso se rellena después, o nunca. Pedirlo aquí sería
 * cobrar un peaje antes de que la empresa haya visto nada, y la empresa
 * no tiene ninguna necesidad de estar aquí: viene a hacerle un favor a
 * un club.
 *
 * Y sigue sin hacer falta cuenta para lo de siempre: buscar clubes y
 * escribirles. La cuenta es para publicar lo que la empresa ofrece y
 * para que la plataforma se acuerde de ella.
 */
export async function registrarEmpresa(
  _estadoPrevio: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const tValidacion = await getTranslations("auth.validacion");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");
  const aceptaTerminos = formData.get("aceptaTerminos") === "on";

  if (!nombre) return { error: "Escribe el nombre de tu empresa." };
  if (!email) return { error: tValidacion("correo") };
  if (password.length < 8) return { error: tValidacion("passwordCorta") };
  if (password !== confirmarPassword) return { error: tValidacion("noCoinciden") };
  if (!aceptaTerminos) return { error: tValidacion("aceptarCondiciones") };

  const origin = (await headers()).get("origin");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: nombre, role: "empresa" },
      emailRedirectTo: `${origin}/${locale}/auth/callback`,
    },
  });

  if (error) return { error: await mensajeErrorAuth(error.message) };

  if (data.user) {
    try {
      const admin = createAdminClient();

      // El rol va en app_metadata, que solo se toca con la clave de
      // servicio: en user_metadata lo podría cambiar el propio usuario
      // y ascenderse a club.
      await admin.auth.admin.updateUserById(data.user.id, {
        app_metadata: { role: "empresa" },
      });

      // La ficha se crea ya, con el nombre puesto. El disparador de la
      // migración 0033 le pone el enlace público a partir de él.
      //
      // Con el cliente admin porque, con la confirmación de correo
      // activada, todavía no hay sesión y la regla de fila rechazaría
      // el insert.
      await admin.from("companies").upsert({ id: data.user.id, name: nombre });

      await registrarConsentimiento(
        admin,
        data.user.id,
        CONSENT_TYPES.termsAndPrivacy,
        LEGAL_VERSIONS.terms,
      );
    } catch {
      return {
        error: "Tu cuenta se ha creado, pero ha habido un problema técnico. Contacta con soporte.",
      };
    }
  }

  return redirect({ href: "/revisa-tu-correo", locale });
}
