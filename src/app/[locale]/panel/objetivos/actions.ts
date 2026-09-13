"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { avisarDeFallo } from "@/lib/monitoring";
import { esEstadoValido, esOrigenValido } from "@/lib/prospectos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA = "/panel/objetivos";

async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  return { supabase, user };
}

function leerTexto(formData: FormData, campo: string, maximo = 200): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor.slice(0, maximo);
}

/** Apunta una empresa a la que el club quiere escribir. */
export async function guardarObjetivo(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const nombre = leerTexto(formData, "nombre", 160);
  if (!nombre) return { error: "Escribe al menos el nombre de la empresa." };

  const origen = String(formData.get("origen") ?? "otro");
  const proximo = leerTexto(formData, "proximoPaso", 10);

  // La fecha llega de un campo de tipo date, pero el formulario lo manda
  // el navegador y puede venir cualquier cosa.
  if (proximo !== null && !/^\d{4}-\d{2}-\d{2}$/.test(proximo)) {
    return { error: "La fecha de volver a llamar no es válida." };
  }

  const { error } = await sesion.supabase.from("club_prospects").insert({
    club_id: sesion.user.id,
    name: nombre,
    sector: leerTexto(formData, "sector", 120),
    contact_name: leerTexto(formData, "contactoNombre", 120),
    contact_info: leerTexto(formData, "contactoDatos", 200),
    origin: esOrigenValido(origen) ? origen : "otro",
    notes: leerTexto(formData, "notas", 1000),
    next_action_on: proximo,
  });

  if (error) {
    avisarDeFallo("prospectos", "No se ha podido guardar la empresa", error);
    return { error: "No se ha podido guardar. Inténtalo otra vez." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Cambia el estado de una empresa de la lista.
 *
 * Va sin `useActionState` a propósito: son botones sueltos en cada fila
 * y lo que el club espera al pulsarlos es ver la etiqueta cambiada, no
 * leer un mensaje.
 */
export async function cambiarEstadoObjetivo(formData: FormData): Promise<void> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return;

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!id || !esEstadoValido(estado)) return;

  await sesion.supabase
    .from("club_prospects")
    .update({ status: estado })
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  revalidatePath(RUTA);
}

/** Cambia (o quita) la fecha de volver a llamar. */
export async function cambiarProximoPaso(formData: FormData): Promise<void> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return;

  const id = String(formData.get("id") ?? "");
  const fecha = String(formData.get("proximoPaso") ?? "").trim();
  if (!id) return;
  if (fecha !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;

  await sesion.supabase
    .from("club_prospects")
    .update({ next_action_on: fecha === "" ? null : fecha })
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  revalidatePath(RUTA);
}

export async function borrarObjetivo(formData: FormData): Promise<void> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await sesion.supabase.from("club_prospects").delete().eq("id", id).eq("club_id", sesion.user.id);
  revalidatePath(RUTA);
}
