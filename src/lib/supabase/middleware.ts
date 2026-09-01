import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Refresca la sesión de Supabase en cada petición (necesario porque los
 * tokens caducan) y devuelve el usuario autenticado, si lo hay.
 *
 * Importante: siempre se usa `getUser()` (que valida el token contra el
 * servidor de Supabase) y nunca `getSession()`, que solo lee la cookie sin
 * verificarla.
 *
 * Fase 14: recibe la respuesta como parámetro (la que ya ha construido
 * `createIntlMiddleware`, con la cabecera interna del idioma resuelto)
 * en vez de crear la suya propia, para que las cookies de sesión y el
 * idioma viajen en la misma respuesta.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fase 12: se devuelve también el cliente (con la sesión de la
  // petición ya cargada) para que el middleware pueda hacer alguna
  // consulta adicional sin tener que repetir esta configuración de
  // cookies (comprobar si un club está suspendido, más abajo).
  return { user, supabase };
}
