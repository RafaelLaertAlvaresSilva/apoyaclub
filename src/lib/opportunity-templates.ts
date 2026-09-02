import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANTILLAS_OPORTUNIDAD, type PlantillaOportunidad } from "@/lib/opportunities";
import type { OpportunityType } from "@/lib/types";

/**
 * Plantillas para crear una oportunidad sin partir de cero
 * (migración 0015).
 *
 * Antes eran una lista fija en `lib/opportunities.ts`. Ahora viven en la
 * base de datos, con dos consecuencias: se pueden añadir sin desplegar, y
 * un club puede compartir las suyas para que le sirvan a otros.
 *
 * La lista del código se queda como red de seguridad: si la migración
 * todavía no está aplicada o la consulta falla, el club sigue viendo las
 * plantillas de siempre en vez de un hueco.
 */

export type PlantillasPorTipo = Record<OpportunityType, PlantillaOportunidad[]>;

type FilaPlantilla = {
  opportunity_type: OpportunityType;
  title: string;
  description: string | null;
  created_by: string | null;
};

export async function obtenerPlantillas(supabase: SupabaseClient): Promise<PlantillasPorTipo> {
  try {
    const { data, error } = await supabase
      .from("opportunity_templates")
      .select("opportunity_type, title, description, created_by")
      .order("created_by", { ascending: true, nullsFirst: true })
      .order("title", { ascending: true })
      .returns<FilaPlantilla[]>();

    if (error || !data || data.length === 0) return PLANTILLAS_OPORTUNIDAD;

    // Un array nuevo por tipo: se van rellenando abajo.
    const agrupadas: PlantillasPorTipo = {
      equipment: [],
      venue_matches: [],
      social_content: [],
      events_tournaments: [],
      youth: [],
      in_kind: [],
    };

    for (const fila of data) {
      if (!(fila.opportunity_type in agrupadas)) continue;
      agrupadas[fila.opportunity_type].push({
        title: fila.title,
        description: fila.description ?? "",
      });
    }

    return agrupadas;
  } catch {
    return PLANTILLAS_OPORTUNIDAD;
  }
}
