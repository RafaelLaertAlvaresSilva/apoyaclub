"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { fechaDeAccesoValida, fechaDelPlazo, finalDelDia } from "@/lib/acceso-gratuito";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const RUTA_CLUBES = "/admin/clubes";

/**
 * Qué ha pasado al pulsar un botón del listado.
 *
 * Existe porque el botón de regalar acceso puede negarse por motivos
 * legítimos —el club no ha rellenado su ficha, o ya paga por Stripe— y
 * antes se negaba en silencio: se pulsaba y no ocurría nada, que desde
 * fuera es exactamente igual que un botón roto.
 */
export type AvisoAdmin =
  | "regalado"
  | "sin-ficha"
  | "paga-stripe"
  | "fecha"
  | "no-admin"
  | "suspendido"
  | "reactivado"
  | "verificado"
  | "sin-verificar";

async function volverConAviso(aviso: AvisoAdmin): Promise<void> {
  const locale = await getLocale();
  redirect({ href: `${RUTA_CLUBES}?aviso=${aviso}`, locale });
}

/**
 * Igual que `obtenerClubActual` en el panel del club (`app/panel/*`):
 * el middleware ya protege `/admin`, pero cada Server Action se
 * comprueba a sí misma. A diferencia de aquel, aquí se devuelve el
 * cliente con la clave de servicio (createAdminClient), porque estas
 * acciones tocan clubes que no son del usuario que las ejecuta —no
 * tendría sentido escribir políticas de RLS "de admin" fila a fila
 * cuando el rol ya se comprueba aquí antes de tocar la base de datos.
 */
async function obtenerAdminActual(): Promise<
  { admin: ReturnType<typeof createAdminClient> } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "admin") {
    return { error: "Esta acción solo está disponible para administradores." };
  }

  return { admin: createAdminClient() };
}

async function actualizarClub(
  formData: FormData,
  cambios: Record<string, unknown>,
  aviso: AvisoAdmin,
): Promise<void> {
  const contexto = await obtenerAdminActual();
  if ("error" in contexto) return volverConAviso("no-admin");

  const id = String(formData.get("id") ?? "");
  if (!id) return volverConAviso("no-admin");

  await contexto.admin.from("clubs").update(cambios).eq("id", id);
  revalidatePath(RUTA_CLUBES);

  // Con aviso, como el de regalar acceso. Suspender un club le tumba la
  // página pública y le corta el panel, y hasta ahora no decía nada:
  // desde fuera, hacerlo y que fallase se veían exactamente igual.
  return volverConAviso(aviso);
}

/** Bloqueo total (Fase 12): el club pierde el acceso a su panel y desaparece de la página pública y del buscador. */
export async function suspenderClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: true, admin_suspended_at: new Date().toISOString() }, "suspendido");
}

export async function reactivarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: false, admin_suspended_at: null }, "reactivado");
}

/** Insignia pública de "verificado" en la página del club. */
export async function verificarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: true, verified_at: new Date().toISOString() }, "verificado");
}

export async function quitarVerificacionClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: false, verified_at: null }, "sin-verificar");
}

/**
 * Regala acceso a un club invitado hasta la fecha que elija el
 * administrador.
 *
 * Por dentro es la prueba gratuita de siempre con la fecha de fin
 * movida: el club entra en el buscador, tiene su panel entero, recibe
 * el aviso antes de que se le acabe y el cron diario la cierra sola el
 * día señalado. No hace falta acordarse de nada.
 *
 * Para terminar el regalo se guarda la fecha de hoy: esa misma noche el
 * cron lo cierra. Y si el club ya paga por Stripe no se toca nada,
 * porque escribirle encima una prueba dejaría a la plataforma diciendo
 * una cosa y a Stripe cobrando otra.
 */
export async function darAccesoGratuito(formData: FormData): Promise<void> {
  const contexto = await obtenerAdminActual();
  if ("error" in contexto) return volverConAviso("no-admin");

  const id = String(formData.get("id") ?? "");

  // El plazo llega de los botones rápidos (seis meses, un año, fin de
  // temporada) y la fecha, del calendario de al lado. El botón manda:
  // si se ha pulsado uno, es lo que el administrador acaba de decidir.
  const plazo = fechaDelPlazo(String(formData.get("plazo") ?? ""));
  const hasta = plazo ?? fechaDeAccesoValida(String(formData.get("hasta") ?? ""));
  if (!id || !hasta) return volverConAviso("fecha");

  const { data: fila } = await contexto.admin
    .from("clubs")
    .select("stripe_subscription_id")
    .eq("id", id)
    .maybeSingle<{ stripe_subscription_id: string | null }>();

  // Un club que todavía no ha guardado su ficha no tiene fila en
  // `clubs` —se crea al guardar nombre y localidad, que son
  // obligatorios— y por tanto no hay dónde escribirle el acceso.
  if (!fila) return volverConAviso("sin-ficha");

  // Y a uno que ya paga no se le escribe una prueba por encima: la
  // plataforma diría una cosa y Stripe estaría cobrando otra.
  if (fila.stripe_subscription_id) return volverConAviso("paga-stripe");

  const fin = finalDelDia(hasta);

  await contexto.admin
    .from("clubs")
    .update({
      subscription_status: "trialing",
      trial_ends_at: fin,
      current_period_end: fin,
      // Los avisos de caducidad son de otra cosa (una cancelación que el
      // club programó). Se limpian para que no le llegue un recordatorio
      // que ya no viene a cuento.
      cancel_at_period_end: false,
      reminder_7d_sent_at: null,
      reminder_3d_sent_at: null,
      reminder_1d_sent_at: null,
    })
    .eq("id", id);

  revalidatePath(RUTA_CLUBES);
  return volverConAviso("regalado");
}
