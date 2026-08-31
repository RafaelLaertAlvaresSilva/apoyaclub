import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

/**
 * Prefijo de ruta privada de cada rol: club -> /panel, empresa ->
 * /empresa, admin -> /admin (Fase 12). Es el mismo mapa que usa el
 * login para redirigir tras autenticar, así que las dos cosas no se
 * pueden desincronizar.
 */
const RUTAS_POR_ROL = Object.entries(RUTA_POR_ROL) as [Role, string][];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const rutaProtegida = RUTAS_POR_ROL.find(([, prefijo]) => pathname.startsWith(prefijo));

  // Ruta pública: dejamos pasar (la respuesta ya lleva las cookies de
  // sesión refrescadas por updateSession).
  if (!rutaProtegida) {
    return supabaseResponse;
  }

  // Ruta privada sin sesión: al login, recordando a dónde quería ir.
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const rol = user.app_metadata?.role as Role | undefined;

  // Sesión sin rol asignado (no debería ocurrir): a login por seguridad.
  if (!rol) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const [rolDeLaRuta] = rutaProtegida;

  // No es la ruta de su rol: a la suya propia, no a la que pedía.
  if (rolDeLaRuta !== rol) {
    return NextResponse.redirect(new URL(RUTA_POR_ROL[rol], request.url));
  }

  // Fase 12: un club suspendido por un admin pierde el acceso a su
  // panel de inmediato, aunque su sesión siga siendo válida (no se
  // cierra sesión, solo se le aparta de /panel).
  if (rol === "club") {
    const { data: fila } = await supabase
      .from("clubs")
      .select("admin_suspended")
      .eq("id", user.id)
      .maybeSingle<{ admin_suspended: boolean | null }>();

    if (fila?.admin_suspended) {
      return NextResponse.redirect(new URL("/cuenta-suspendida", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
