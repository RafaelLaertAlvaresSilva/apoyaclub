"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { avisarDeFallo } from "@/lib/monitoring";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import { mediaParaLaFicha } from "@/lib/publico-partidos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_PUBLICO = "/panel/publico";

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

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function fallo(operacion: string, error: unknown, mensaje: string): EstadoGuardado {
  avisarDeFallo("publico", `No se ha podido ${operacion}`, error);
  return { error: mensaje };
}

/** Apunta un partido con la gente que hubo. */
export async function guardarPartido(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const fecha = leerTexto(formData, "fecha");
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: "Pon la fecha del partido." };
  }

  const rival = leerTexto(formData, "rival");
  if (!rival) return { error: "Escribe contra quién se jugó." };

  // El público se lee a mano en vez de con `Number(...)` a secas: un
  // campo vacío se convierte en 0 con Number, y "0 personas" y "no lo
  // he apuntado" no son lo mismo.
  const publicoTexto = leerTexto(formData, "publico");
  if (publicoTexto === null) return { error: "Escribe cuánta gente hubo." };

  const publico = Number(publicoTexto.replace(/\./g, "").replace(/\s/g, ""));
  if (!Number.isInteger(publico) || publico < 0 || publico > 200000) {
    return { error: "El público tiene que ser un número entre 0 y 200.000." };
  }

  const { error } = await sesion.supabase.from("club_matches").insert({
    club_id: sesion.user.id,
    played_on: fecha,
    opponent: rival.slice(0, 120),
    competition: leerTexto(formData, "competicion")?.slice(0, 120) ?? null,
    team: leerTexto(formData, "equipo")?.slice(0, 120) ?? null,
    home: String(formData.get("donde") ?? "casa") === "casa",
    attendance: publico,
    notes: leerTexto(formData, "notas")?.slice(0, 1000) ?? null,
  });

  if (error) return fallo("guardar el partido", error, "No se ha podido guardar el partido.");

  revalidatePath(RUTA_PUBLICO);
  return { ok: true };
}

export async function borrarPartido(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se sabe qué partido borrar." };

  const { error } = await sesion.supabase
    .from("club_matches")
    .delete()
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  if (error) return fallo("borrar el partido", error, "No se ha podido borrar el partido.");

  revalidatePath(RUTA_PUBLICO);
  return { ok: true };
}

/**
 * Lleva la media real a la ficha del club.
 *
 * A propósito con un botón y no por detrás: `average_attendance` es un
 * dato que el club escribió él, y pisárselo cada vez que apunta un
 * partido es cambiarle la ficha sin avisar. La media se le enseña, y
 * él decide.
 */
// Sin parámetros a propósito: `useActionState` le pasa el estado
// anterior y el formulario, y aquí no se necesita ninguno de los dos.
export async function usarMediaEnLaFicha(): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const partidos = await obtenerPartidosDelClub(sesion.supabase, sesion.user.id);
  const media = mediaParaLaFicha(partidos);

  if (media === null) {
    return { error: "Todavía no hay partidos apuntados para calcular la media." };
  }

  const { error } = await sesion.supabase
    .from("clubs")
    .update({ average_attendance: media })
    .eq("id", sesion.user.id);

  if (error) return fallo("copiar la media a la ficha", error, "No se ha podido guardar la media en tu ficha.");

  revalidatePath(RUTA_PUBLICO);
  revalidatePath("/panel");
  return { ok: true };
}
