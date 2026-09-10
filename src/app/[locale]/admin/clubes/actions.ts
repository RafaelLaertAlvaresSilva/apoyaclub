"use server";

import { revalidatePath } from "next/cache";
import { fechaDeAccesoValida, finalDelDia } from "@/lib/acceso-gratuito";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const RUTA_CLUBES = "/admin/clubes";

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

async function actualizarClub(formData: FormData, cambios: Record<string, unknown>): Promise<void> {
  const contexto = await obtenerAdminActual();
  if ("error" in contexto) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await contexto.admin.from("clubs").update(cambios).eq("id", id);
  revalidatePath(RUTA_CLUBES);
}

/** Bloqueo total (Fase 12): el club pierde el acceso a su panel y desaparece de la página pública y del buscador. */
export async function suspenderClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: true, admin_suspended_at: new Date().toISOString() });
}

export async function reactivarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: false, admin_suspended_at: null });
}

/** Insignia pública de "verificado" en la página del club. */
export async function verificarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: true, verified_at: new Date().toISOString() });
}

export async function quitarVerificacionClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: false, verified_at: null });
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
  if ("error" in contexto) return;

  const id = String(formData.get("id") ?? "");
  const hasta = fechaDeAccesoValida(String(formData.get("hasta") ?? ""));
  if (!id || !hasta) return;

  const { data: fila } = await contexto.admin
    .from("clubs")
    .select("stripe_subscription_id")
    .eq("id", id)
    .maybeSingle<{ stripe_subscription_id: string | null }>();

  if (!fila || fila.stripe_subscription_id) return;

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
}
