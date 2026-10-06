import { clubSponsorRowToSponsor, type ClubSponsorRow } from "@/lib/club-mappers";
import { contarRenovacionesQueAvisan } from "@/lib/renovaciones";
import { createClient } from "@/lib/supabase/server";

/**
 * Cuántas renovaciones piden atención, para el contador rojo del menú.
 *
 * Se traen las filas y se cuenta en memoria en vez de preguntárselo a
 * Postgres con un `where renewal_date < …`. El motivo: esa columna
 * llega con la migración 0050 y, mientras un club no la haya aplicado,
 * no existe. Un filtro por una columna que no está devuelve error, y
 * este contador se pinta en el menú de TODAS las páginas del panel: un
 * error aquí deja al club sin menú en ningún sitio.
 *
 * Un club tiene patrocinadores contados, así que traerlos enteros no es
 * caro. Si algún día deja de serlo, lo que toca es cachear, no filtrar.
 */
export async function contarRenovacionesQueAvisanDelClub(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("club_sponsors")
      .select("*")
      .eq("club_id", user.id)
      .returns<ClubSponsorRow[]>();

    if (error || !data) return 0;

    return contarRenovacionesQueAvisan(data.map(clubSponsorRowToSponsor), new Date());
  } catch {
    // El menú se pinta en todas las páginas del panel. Si esto falla,
    // el club se queda sin un número, no sin navegación.
    return 0;
  }
}
