import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

/**
 * Punto de entrada único para los enlaces que envía Supabase por correo:
 * confirmación de registro y recuperación de contraseña. Intercambia el
 * código por una sesión y redirige a `next` (o al panel según el rol).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const rol = data.user?.app_metadata?.role as Role | undefined;
      const destino = rol ? RUTA_POR_ROL[rol] : "/";
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
