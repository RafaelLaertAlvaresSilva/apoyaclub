import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";
import { LoginForm } from "./LoginForm";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  // La pestaña, en el idioma de la página (antes, siempre en español).
  return { title: (await getTranslations("common.tituloPestana"))("acceder") };
}

/**
 * Quien ya tiene la sesión abierta no ve un formulario de acceso: se le
 * lleva a su sitio. Enseñarle la caja de "introduce tus datos" a alguien
 * que ya ha entrado es lo que hace pensar que hay que cerrar sesión para
 * poder volver a usar la página.
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rol = user?.app_metadata?.role as Role | undefined;

  if (rol) {
    const locale = await getLocale();
    redirect({ href: RUTA_POR_ROL[rol], locale });
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
