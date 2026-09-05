"use server";

import { revalidatePath } from "next/cache";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import type { ProposalStatus, Role } from "@/lib/types";

export type EstadoPropuesta = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const ESTADOS: ProposalStatus[] = ["new", "seen", "in_conversation", "discarded"];

/**
 * La empresa mueve una propuesta de estado. No hay conversación dentro
 * de la plataforma: esto es una bandeja para no perder nada, y el
 * contacto de verdad se hace por fuera.
 */
export async function cambiarEstadoPropuesta(
  _previo: EstadoPropuesta,
  formData: FormData,
): Promise<EstadoPropuesta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "empresa") {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const estado = String(formData.get("estado") ?? "") as ProposalStatus;

  if (!id) return { error: "No se ha encontrado la propuesta." };
  if (!ESTADOS.includes(estado)) return { error: "Estado no válido." };

  const { error } = await supabase
    .from("club_proposals")
    .update({ status: estado })
    .eq("id", id)
    .eq("company_id", user.id);

  if (error) {
    avisarDeFallo("tareas", "No se ha podido cambiar el estado de una propuesta", error);
    return { error: "No se ha podido guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/empresa/propuestas");
  return { ok: true };
}
