"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";

export type EstadoReenvio = { error: string } | { ok: true } | null;

/**
 * Vuelve a enviar el correo de confirmación.
 *
 * Sin esto, un club que no recibía el correo —fue a spam, se equivocó
 * de letra al escribirlo, el proveedor lo tiró— se quedaba encerrado:
 * no podía entrar, y la pantalla no ofrecía ninguna salida. Es el punto
 * donde más gente abandona, y ya nos pasó con los correos de prueba.
 *
 * Se pide la dirección otra vez en lugar de arrastrarla en la URL: un
 * correo en la barra del navegador acaba en el historial, en los
 * registros del servidor y en cualquier enlace que se comparta.
 *
 * Y se contesta siempre lo mismo, salga bien o mal. Si dijera "esa
 * cuenta no existe", cualquiera podría usar esta pantalla para
 * averiguar qué correos están registrados en ApoyaClub.
 */
export async function reenviarConfirmacion(
  _estadoPrevio: EstadoReenvio,
  formData: FormData,
): Promise<EstadoReenvio> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Escribe la dirección de correo con la que te registraste." };
  }

  const origin = (await headers()).get("origin");
  const locale = await getLocale();
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/${locale}/auth/callback` },
  });

  // Solo se cuenta el fallo para poder mirarlo después; al usuario se le
  // dice lo mismo en los dos casos.
  if (error) avisarDeFallo("auth", "No se ha podido reenviar la confirmación", error);

  return { ok: true };
}
