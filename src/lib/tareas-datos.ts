import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import { hoyISO, tareaRowToTarea, type TareaPatrocinio, type TareaRow } from "@/lib/tareas-patrocinio";
import type { Role } from "@/lib/types";

/**
 * Lectura de las tareas de patrocinio (migración 0030).
 *
 * Siempre con la sesión del propio club, nunca con la clave de
 * servicio: esto es su agenda privada y RLS es quien garantiza que un
 * club no vea la de otro.
 */
export async function obtenerTareasDelClub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
): Promise<TareaPatrocinio[]> {
  const { data, error } = await supabase
    .from("club_sponsor_tasks")
    .select("*")
    .eq("club_id", clubId)
    .order("due_on", { ascending: true })
    .returns<TareaRow[]>();

  if (error) {
    avisarDeFallo("tareas", "No se han podido leer las tareas del club", error);
    return [];
  }

  return (data ?? []).map(tareaRowToTarea);
}

/**
 * Cuántas tareas se le han pasado ya de fecha, para el contador rojo de
 * la navegación. Devuelve 0 ante cualquier problema: un contador que
 * falla no puede tumbar el panel entero.
 */
export async function contarTareasVencidas(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role as Role | undefined) !== "club") return 0;

    const { count } = await supabase
      .from("club_sponsor_tasks")
      .select("id", { count: "exact", head: true })
      .eq("club_id", user.id)
      .eq("status", "pendiente")
      .lt("due_on", hoyISO());

    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Cuándo se descargó por última vez el informe de cada empresa
 * (migración 0031). La clave del mapa va en minúsculas y sin espacios
 * porque el nombre de la empresa es texto libre y "Ferretería Ramírez"
 * y " ferretería ramírez " tienen que ser la misma.
 */
export async function obtenerUltimosInformes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("club_sponsor_reports")
    .select("company_name, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .returns<{ company_name: string; created_at: string }[]>();

  if (error) {
    avisarDeFallo("tareas", "No se han podido leer los informes generados", error);
    return new Map();
  }

  // Las filas vienen de la más reciente a la más antigua, así que la
  // primera que se ve de cada empresa es la buena.
  const ultimos = new Map<string, string>();
  for (const fila of data ?? []) {
    const clave = fila.company_name.trim().toLowerCase();
    if (!ultimos.has(clave)) ultimos.set(clave, fila.created_at);
  }

  return ultimos;
}
