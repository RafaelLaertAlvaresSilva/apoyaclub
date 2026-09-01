"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ContactRequestStatus, Role } from "@/lib/types";

const RUTA_SOLICITUDES = "/panel/solicitudes";

const ESTADOS_VALIDOS: ContactRequestStatus[] = [
  "new",
  "seen",
  "in_conversation",
  "closed",
  "discarded",
];

/**
 * Igual que `obtenerClubActual` de `app/panel/actions.ts` y
 * `app/panel/oportunidades/actions.ts`: recupera el cliente de Supabase
 * y el usuario autenticado, comprobando que tiene rol "club".
 */
async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  return { supabase, user };
}

/** Cambia el estado de una solicitud de contacto recibida (un clic, igual que `cambiarEstadoOportunidad`). */
export async function cambiarEstadoSolicitud(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(ESTADOS_VALIDOS as string[]).includes(status)) return;

  await supabase
    .from("contact_requests")
    .update({ status: status as ContactRequestStatus })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_SOLICITUDES);
}
