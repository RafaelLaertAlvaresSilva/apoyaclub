import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

/**
 * Prefijo de ruta privada de cada rol (sin idioma): club -> /panel,
 * empresa -> /empresa, admin -> /admin (Fase 12). Es el mismo mapa que
 * usa el login para redirigir tras autenticar, así que las dos cosas no
 * se pueden desincronizar.
 */
const RUTAS_POR_ROL = Object.entries(RUTA_POR_ROL) as [Role, string][];

const intlMiddleware = createIntlMiddleware(routing);

/** Quita el prefijo de idioma ("/es/panel" -> "/panel") para comparar contra RUTA_POR_ROL. */
function sinPrefijoDeIdioma(pathname: string): string {
  const patron = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);
  const sinPrefijo = pathname.replace(patron, "");
  return sinPrefijo === "" ? "/" : sinPrefijo;
}

export async function middleware(request: NextRequest) {
  // 1. next-intl decide el idioma (cookie, cabecera Accept-Language o el
  // que ya lleve la URL) y, si la ruta pedida no llevaba prefijo,
  // devuelve directamente la redirección a la versión con prefijo — en
  // ese caso no hace falta mirar la sesión todavía, se comprobará en la
  // siguiente petición, ya con el prefijo puesto.
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2. Sesión de Supabase, reutilizando la misma respuesta de next-intl
  // como base (para no perder la cabecera interna con la que next-intl
  // le pasa el idioma resuelto a los Server Components).
  const { user, supabase } = await updateSession(request, intlResponse);

  const { pathname } = request.nextUrl;
  const locale = pathname.split("/")[1];
  const rutaSinIdioma = sinPrefijoDeIdioma(pathname);

  const rutaProtegida = RUTAS_POR_ROL.find(([, prefijo]) => rutaSinIdioma.startsWith(prefijo));

  // Ruta pública: dejamos pasar (la respuesta ya lleva las cookies de
  // sesión refrescadas por updateSession y el idioma resuelto).
  if (!rutaProtegida) {
    return intlResponse;
  }

  // Ruta privada sin sesión: al login, recordando a dónde quería ir.
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", rutaSinIdioma);
    return NextResponse.redirect(loginUrl);
  }

  const rol = user.app_metadata?.role as Role | undefined;

  // Sesión sin rol asignado (no debería ocurrir): a login por seguridad.
  if (!rol) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  const [rolDeLaRuta] = rutaProtegida;

  // No es la ruta de su rol: a la suya propia, no a la que pedía.
  if (rolDeLaRuta !== rol) {
    return NextResponse.redirect(new URL(`/${locale}${RUTA_POR_ROL[rol]}`, request.url));
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
      return NextResponse.redirect(new URL(`/${locale}/cuenta-suspendida`, request.url));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
