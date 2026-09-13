import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { esRutaAbiertaSinSuscripcion, puedeUsarElPanel } from "@/lib/acceso-club";
import { areaPrivadaDe } from "@/lib/areas-privadas";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";
import { avisarDeFallo } from "@/lib/monitoring";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

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

  // Qué área privada es, si es alguna. Ver `lib/areas-privadas.ts`:
  // esta lista NO puede salir de `RUTA_POR_ROL`, porque ahí un rol
  // puede apuntar a la portada y entonces toda la web pasaría a ser
  // zona privada.
  const rutaProtegida = areaPrivadaDe(rutaSinIdioma);

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

  let rol = user.app_metadata?.role as Role | undefined;

  // El rol se escribe en `app_metadata` inmediatamente después de crear
  // la cuenta, pero el token que lleva el navegador puede ser de un
  // instante anterior, y ahí dentro el usuario todavía no tiene rol.
  // Hasta que ese token caduca por su cuenta —una hora— el club entra
  // en la web, se ve la sesión abierta y su propio panel le rechaza.
  // Le pasó a un club de verdad: cerrar sesión y volver a entrar lo
  // arreglaba, porque eso pide un token nuevo. Aquí se pide ese token
  // nuevo por él, en silencio, y sigue su camino.
  if (!rol) {
    const { data: renovada } = await supabase.auth.refreshSession();
    rol = renovada.user?.app_metadata?.role as Role | undefined;
  }

  // Si después de renovar sigue sin rol, la cuenta se quedó a medio
  // crear de verdad y no lo arregla volver a entrar. Se avisa a Sentry,
  // porque es un club que no puede usar lo que ha contratado y nadie se
  // enteraría de otra forma.
  if (!rol) {
    avisarDeFallo("sesion", `Sesión sin rol después de renovarla (usuario ${user.id})`);
    return NextResponse.redirect(
      new URL(`/${locale}/login?motivo=sesion-sin-rol`, request.url),
    );
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
      .select("admin_suspended, subscription_status")
      .eq("id", user.id)
      .maybeSingle<{ admin_suspended: boolean | null; subscription_status: SubscriptionStatus }>();

    if (fila?.admin_suspended) {
      return NextResponse.redirect(new URL(`/${locale}/cuenta-suspendida`, request.url));
    }

    // Terminado el mes de prueba, la plataforma se usa pagando: el club
    // sigue entrando, pero solo a la página de suscripción y a la de
    // privacidad. Ver `lib/acceso-club.ts` para el porqué de esas dos
    // excepciones, que no son un descuido.
    //
    // Un club sin fila todavía no ha guardado su ficha: está recién
    // registrado y su mes corre, así que pasa.
    if (
      fila &&
      !puedeUsarElPanel(fila.subscription_status) &&
      !esRutaAbiertaSinSuscripcion(rutaSinIdioma)
    ) {
      return NextResponse.redirect(
        new URL(`/${locale}/panel/suscripcion?motivo=prueba-terminada`, request.url),
      );
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
