import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

/**
 * Punto de entrada único para los enlaces que envía Supabase por correo:
 * confirmación de registro y recuperación de contraseña. Intercambia el
 * código por una sesión y redirige a `next` (o al panel según el rol).
 *
 * Fase 14: la ruta vive bajo /[locale]/auth/callback, así que el idioma
 * con el que se generó el enlace (ver "emailRedirectTo" en las Server
 * Actions de registro y "redirectTo" en la de recuperar contraseña)
 * llega en params.locale; todo destino relativo se antepone con él.
 */
export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}/${locale}${next}`);
      }

      const rol = data.user?.app_metadata?.role as Role | undefined;
      const destino = rol ? RUTA_POR_ROL[rol] : "/";
      return NextResponse.redirect(`${origin}/${locale}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/error`);
}
