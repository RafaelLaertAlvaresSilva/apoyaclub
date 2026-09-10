import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RUTA_POR_ROL, type Role } from "@/lib/types";

/**
 * La otra puerta de entrada de los enlaces del correo, y la que de
 * verdad usan las plantillas desde que el correo lo manda ApoyaClub.
 *
 * El motivo es una escena concreta: el presidente de un club se
 * registra en el ordenador del club y luego abre el correo en el
 * móvil. La ruta hermana `/auth/callback` no le sirve, porque el
 * código PKCE que Supabase pone en el enlace solo se puede canjear en
 * el mismo navegador que empezó el registro: en el móvil devuelve un
 * error y el club se queda fuera sin entender por qué.
 *
 * Aquí se verifica un `token_hash`, que no está atado a ningún
 * navegador. El enlace funciona en el móvil, en el portátil de casa o
 * reenviado a otra persona del club.
 *
 * `/auth/callback` se queda tal cual: sigue haciendo falta para los
 * enlaces antiguos que ya estén en el buzón de alguien.
 */

const TIPOS_VALIDOS: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const next = searchParams.get("next");

  const error = `${origin}/${locale}/auth/error`;

  if (!tokenHash || !tipo || !TIPOS_VALIDOS.includes(tipo as EmailOtpType)) {
    return NextResponse.redirect(error);
  }

  // `next` viene de la plantilla del correo, pero el enlace lo abre
  // quien sea: solo se admite una ruta interna, nunca una dirección
  // completa que pudiera llevar el enlace a otro sitio.
  const destinoPedido = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  const supabase = await createClient();
  const { data, error: fallo } = await supabase.auth.verifyOtp({
    type: tipo as EmailOtpType,
    token_hash: tokenHash,
  });

  if (fallo) {
    return NextResponse.redirect(error);
  }

  if (destinoPedido) {
    return NextResponse.redirect(`${origin}/${locale}${destinoPedido}`);
  }

  const rol = data.user?.app_metadata?.role as Role | undefined;
  return NextResponse.redirect(`${origin}/${locale}${rol ? RUTA_POR_ROL[rol] : "/"}`);
}
