"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { mensajeErrorAuth } from "@/lib/auth-errors";
import { registrarConsentimiento } from "@/lib/consent";
import { CONSENT_TYPES, LEGAL_VERSIONS } from "@/lib/legal";
import { plazasPilotoLibres } from "@/lib/piloto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EstadoRegistro = { error: string } | null;

export async function registrarClub(
  _estadoPrevio: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const tValidacion = await getTranslations("auth.validacion");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");
  const aceptaTerminos = formData.get("aceptaTerminos") === "on";
  // Viene de apoyaclub.com/piloto (la campaña): 6 meses gratis si
  // quedan plazas. Se comprueba aquí, no en el navegador.
  const quierePiloto = formData.get("piloto") === "1";

  if (!nombre) {
    return { error: tValidacion("nombreClub") };
  }
  if (!email) {
    return { error: tValidacion("correo") };
  }
  if (password.length < 8) {
    return { error: tValidacion("passwordCorta") };
  }
  if (password !== confirmarPassword) {
    return { error: tValidacion("noCoinciden") };
  }
  if (!aceptaTerminos) {
    return { error: tValidacion("aceptarCondiciones") };
  }

  const origin = (await headers()).get("origin");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: nombre, role: "club", idioma: locale },
      emailRedirectTo: `${origin}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: await mensajeErrorAuth(error.message) };
  }

  // El rol se guarda en app_metadata (solo modificable con la clave de
  // servicio) para que no pueda alterarlo el propio usuario.
  if (data.user) {
    try {
      const admin = createAdminClient();
      const piloto = quierePiloto && ((await plazasPilotoLibres(admin)) ?? 0) > 0;
      await admin.auth.admin.updateUserById(data.user.id, {
        // `piloto` también aquí y no en `user_metadata`: el propio
        // usuario puede cambiar su `user_metadata`, y así se daría 6
        // meses gratis él solo (migración 0057).
        app_metadata: piloto ? { role: "club", piloto: true } : { role: "club" },
      });
      // Registro del consentimiento (Fase 11): se hace con el cliente
      // admin porque, con la confirmación de email activada, todavía
      // no hay sesión (RLS bloquearía el insert con el cliente normal).
      await registrarConsentimiento(admin, data.user.id, CONSENT_TYPES.termsAndPrivacy, LEGAL_VERSIONS.terms);
    } catch {
      return {
        error:
          tValidacion("problemaTecnico"),
      };
    }
  }

  return redirect({ href: "/revisa-tu-correo", locale });
}
