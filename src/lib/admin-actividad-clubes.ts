import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Actividad por club para el panel de administración (migración 0022).
 *
 * Responde a las dos preguntas que se hace quien lleva la plataforma
 * cuando abre el listado de clubes: cuántas empresas han entrado en la
 * ficha de cada uno y cuántas han llegado a mirar su contacto. Un club
 * con cero de las dos cosas es un club que se va a dar de baja, y
 * conviene verlo antes de que pase.
 *
 * Se cuenta en una sola pasada para todos los clubes en vez de una
 * consulta por club: con cien clubes serían trescientas consultas.
 */
export type ActividadClub = {
  /** Visitas totales a la ficha, con y sin sesión. */
  visitas: number;
  /** Empresas registradas distintas que han entrado. */
  empresas: number;
  /** Veces que se han abierto los datos de contacto. */
  contactos: number;
  /** Empresas registradas distintas que abrieron el contacto. */
  empresasQueVieronContacto: number;
};

type FilaEvento = { club_id: string; company_id: string | null };

export async function obtenerActividadPorClub(
  clubIds: string[],
  dias = 90,
  ahora: Date = new Date(),
): Promise<Map<string, ActividadClub>> {
  const actividad = new Map<string, ActividadClub>();
  if (clubIds.length === 0) return actividad;

  const admin = createAdminClient();
  const desde = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: visitas }, { data: contactos }] = await Promise.all([
    admin
      .from("club_page_views")
      .select("club_id, company_id")
      .in("club_id", clubIds)
      .gte("created_at", desde)
      .returns<FilaEvento[]>(),
    admin
      .from("club_contact_views")
      .select("club_id, company_id")
      .in("club_id", clubIds)
      .gte("created_at", desde)
      .returns<FilaEvento[]>(),
  ]);

  // Los "distintas" se cuentan con conjuntos y se convierten a número al
  // final: una misma empresa que entra cinco veces es una empresa.
  const empresasPorClub = new Map<string, Set<string>>();
  const empresasContactoPorClub = new Map<string, Set<string>>();

  for (const clubId of clubIds) {
    actividad.set(clubId, {
      visitas: 0,
      empresas: 0,
      contactos: 0,
      empresasQueVieronContacto: 0,
    });
    empresasPorClub.set(clubId, new Set());
    empresasContactoPorClub.set(clubId, new Set());
  }

  for (const fila of visitas ?? []) {
    const datos = actividad.get(fila.club_id);
    if (!datos) continue;
    datos.visitas += 1;
    if (fila.company_id) empresasPorClub.get(fila.club_id)?.add(fila.company_id);
  }

  for (const fila of contactos ?? []) {
    const datos = actividad.get(fila.club_id);
    if (!datos) continue;
    datos.contactos += 1;
    if (fila.company_id) empresasContactoPorClub.get(fila.club_id)?.add(fila.company_id);
  }

  for (const [clubId, datos] of actividad) {
    datos.empresas = empresasPorClub.get(clubId)?.size ?? 0;
    datos.empresasQueVieronContacto = empresasContactoPorClub.get(clubId)?.size ?? 0;
  }

  return actividad;
}
