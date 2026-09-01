"use server";

import { revalidatePath } from "next/cache";
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
