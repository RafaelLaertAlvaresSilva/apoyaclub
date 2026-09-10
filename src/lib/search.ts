import { cajaDelimitadora, distanciaKm, geocodificarDireccion, type Coordenadas } from "@/lib/geocoding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { etiquetaEquipo } from "@/lib/opportunities";
import type {
  BudgetPeriod,
  CategoriaNecesidad,
  CollaborationType,
  ObjectiveTag,
  OpportunityType,
  SponsorLevel,
} from "@/lib/types";
import {
  agruparPorClub,
  type FiltrosBusqueda,
  type OrdenBusqueda,
  type PaginaBusqueda,
  type ResultadoClub,
  type ResultadoOportunidad,
  type VistaBusqueda,
} from "@/lib/search-types";

// Este módulo es el único que habla con Supabase; los tipos y
// `agruparPorClub` viven en `lib/search-types.ts` (sin dependencias de
// servidor) para poder importarlos también desde componentes de
// cliente. Se reexportan aquí para que el resto del código del
// servidor solo tenga que importar de `lib/search`.
export { agruparPorClub };
export type { FiltrosBusqueda, OrdenBusqueda, PaginaBusqueda, ResultadoClub, ResultadoOportunidad, VistaBusqueda };

/**
 * Buscador público de oportunidades y clubes (`/buscar`, Fase 7).
 *
 * Todo pasa por la vista pública `opportunity_search_view` (migración
 * 0004): cada fila es una oportunidad disponible con los datos de su
 * club ya incluidos, así que no hace falta ninguna consulta autenticada
 * ni ningún join en el cliente para el grueso del filtrado.
 *
 * Radio en km (cómo funciona en esta fase, MVP): con pocos clubes en la
 * plataforma no compensa añadir una extensión geoespacial a Postgres.
 * En su lugar: 1) se geocodifica el texto de ubicación que escribe la
 * empresa (mismo geocodificador que usa el club al guardar su perfil),
 * 2) se prefiltra en SQL por una caja delimitadora simple sobre
 * `latitude`/`longitude` (usa el índice `clubs_lat_lng_idx`), y 3) sobre
 * ese lote acotado se calcula la distancia exacta (Haversine) y se
 * ordena/pagina ya en el servidor de Next.js. Si el catálogo crece
 * mucho, esto se puede sustituir por una función RPC con la extensión
 * `earthdistance` sin tocar el resto del buscador: toda la lógica de
 * distancia vive aislada en este archivo y en `lib/geocoding.ts`.
 */

/** Tope de candidatos cuando hay filtro u orden geográfico (ver cabecera del archivo). */
const TAMANO_LOTE_GEO = 300;

type FilaBusqueda = {
  opportunity_id: string;
  club_id: string;
  title: string;
  description: string | null;
  opportunity_type: OpportunityType;
  value: number | string;
  duration: string | null;
  period: BudgetPeriod | null;
  collaboration_type: CollaborationType | null;
  objectives: ObjectiveTag[] | null;
  opportunity_created_at: string;
  club_slug: string;
  club_name: string;
  club_city: string;
  club_province: string | null;
  club_postal_code: string | null;
  club_logo_url: string | null;
  club_latitude: number | null;
  club_longitude: number | null;
  sponsor_level: SponsorLevel | null;
  exclusivity: string | null;
  team_sport: string | null;
  team_category: string | null;
  team_gender: string | null;
  slots_total: number | null;
  slots_taken: number | null;
  is_need: boolean | null;
  need_category: CategoriaNecesidad | null;
  /** Porcentaje de ficha rellenada del club (migración 0020). */
  club_profile_score: number | null;
  /** El mismo porcentaje en decenas (0-10), que es como se ordena. */
  club_visibility_bucket: number | null;
};

function filaAResultado(fila: FilaBusqueda, centro: Coordenadas | null): ResultadoOportunidad {
  return {
    opportunityId: fila.opportunity_id,
    clubId: fila.club_id,
    clubSlug: fila.club_slug,
    clubName: fila.club_name,
    clubCity: fila.club_city,
    clubProvince: fila.club_province,
    clubLogoUrl: fila.club_logo_url,
    title: fila.title,
    description: fila.description,
    opportunityType: fila.opportunity_type,
    value: typeof fila.value === "string" ? Number.parseFloat(fila.value) : fila.value,
    duration: fila.duration,
    period: fila.period,
    collaborationType: fila.collaboration_type,
    objectives: fila.objectives ?? [],
    sponsorLevel: fila.sponsor_level ?? "libre",
    slotsTotal: fila.slots_total,
    slotsTaken: fila.slots_taken ?? 0,
    esNecesidad: fila.is_need ?? false,
    categoriaNecesidad: fila.need_category,
    profileScore: fila.club_profile_score ?? 0,
    visibilityBucket: fila.club_visibility_bucket ?? 0,
    exclusivity: fila.exclusivity,
    teamLabel: etiquetaEquipo({
      sport: fila.team_sport,
      category: fila.team_category,
      gender: fila.team_gender,
    }),
    createdAt: fila.opportunity_created_at,
    distanceKm:
      centro && fila.club_latitude != null && fila.club_longitude != null
        ? distanciaKm(centro, { latitude: fila.club_latitude, longitude: fila.club_longitude })
        : null,
  };
}

/** Quita caracteres que romperían la sintaxis de filtros de PostgREST (`,`, `(`, `)`, `%`). */
function sanear(texto: string): string {
  return texto.replace(/[,()%]/g, " ").trim();
}

async function resolverCentro(filtros: FiltrosBusqueda): Promise<Coordenadas | null> {
  if (!filtros.radioKm || !filtros.ubicacion) return null;
  return geocodificarDireccion({ city: filtros.ubicacion, province: filtros.provincia });
}

/**
 * Ids de los clubes que tienen al menos un equipo que coincide con
 * deporte/categoría/género/nivel. `null` cuando no hay ningún filtro de
 * equipo activo (no restringe nada); array (posiblemente vacío) en caso
 * contrario. Las oportunidades no están ligadas a un equipo concreto,
 * así que el filtro se aplica a nivel de club.
 */
async function clubesConEquipoCoincidente(filtros: FiltrosBusqueda): Promise<string[] | null> {
  if (!filtros.deporte && !filtros.categoria && !filtros.genero && !filtros.nivelEquipo) {
    return null;
  }

  const supabase = createPublicClient();
  let consulta = supabase.from("club_teams").select("club_id");

  if (filtros.deporte) consulta = consulta.eq("sport", filtros.deporte);
  if (filtros.categoria) consulta = consulta.eq("category", filtros.categoria);
  if (filtros.genero) consulta = consulta.eq("gender", filtros.genero);
  if (filtros.nivelEquipo) consulta = consulta.eq("team_level", filtros.nivelEquipo);

  const { data } = await consulta.returns<{ club_id: string }[]>();
  return Array.from(new Set((data ?? []).map((fila) => fila.club_id)));
}

/**
 * Fase 12: un registro por cada búsqueda nueva (nunca por un "cargar
 * más", que reutiliza los mismos filtros con otro `offset`), solo para
 * la métrica "búsquedas realizadas" del panel de admin. Con la clave de
 * servicio porque `search_logs` no tiene ninguna política de RLS
 * (lib/supabase/admin.ts). Si falla, no debe romper la búsqueda en sí.
 */
async function registrarBusqueda(
  filtros: FiltrosBusqueda,
  resultado: PaginaBusqueda<ResultadoOportunidad>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("search_logs").insert({
      filters: filtros,
      results_count: resultado.total ?? resultado.resultados.length,
    });

    // Además del recuento global (Fase 12), se apunta qué clubes han
    // salido: es la mitad de "tu mes en ApoyaClub" que el club ve en su
    // panel (migración 0014). Un club aparece una vez por búsqueda,
    // aunque salgan tres oportunidades suyas.
    const clubesQueAparecen = Array.from(new Set(resultado.resultados.map((fila) => fila.clubId)));
    if (clubesQueAparecen.length > 0) {
      await admin
        .from("club_search_appearances")
        .insert(clubesQueAparecen.map((clubId) => ({ club_id: clubId })));
    }
  } catch (excepcion) {
    console.error("[search_logs] No se ha podido registrar la búsqueda:", excepcion);
  }
}

export async function buscarOportunidades(
  filtros: FiltrosBusqueda,
  paginacion: { offset: number; limite: number },
): Promise<PaginaBusqueda<ResultadoOportunidad>> {
  const supabase = createPublicClient();
  const centro = await resolverCentro(filtros);
  const usaRadio = !!(centro && filtros.radioKm);
  const usaGeo = usaRadio || filtros.orden === "cercania";

  const clubIds = await clubesConEquipoCoincidente(filtros);
  if (clubIds !== null && clubIds.length === 0) {
    return { resultados: [], hayMas: false, total: 0 };
  }

  let consulta = supabase
    .from("opportunity_search_view")
    .select("*", usaGeo ? undefined : { count: "exact" });

  if (clubIds) consulta = consulta.in("club_id", clubIds);
  if (filtros.provincia) consulta = consulta.eq("club_province", filtros.provincia);
  if (filtros.tipos && filtros.tipos.length > 0) consulta = consulta.in("opportunity_type", filtros.tipos);
  if (filtros.presupuestoMin != null) consulta = consulta.gte("value", filtros.presupuestoMin);
  if (filtros.presupuestoMax != null) consulta = consulta.lte("value", filtros.presupuestoMax);
  if (filtros.periodo) consulta = consulta.eq("period", filtros.periodo);
  if (filtros.formasColaboracion && filtros.formasColaboracion.length > 0) {
    consulta = consulta.in("collaboration_type", filtros.formasColaboracion);
  }
  if (filtros.objetivos && filtros.objetivos.length > 0) {
    consulta = consulta.overlaps("objectives", filtros.objetivos);
  }
  if (filtros.niveles && filtros.niveles.length > 0) {
    consulta = consulta.in("sponsor_level", filtros.niveles);
  }

  if (usaRadio && centro) {
    const caja = cajaDelimitadora(centro, filtros.radioKm!);
    consulta = consulta
      .gte("club_latitude", caja.minLat)
      .lte("club_latitude", caja.maxLat)
      .gte("club_longitude", caja.minLon)
      .lte("club_longitude", caja.maxLon);
  } else if (filtros.ubicacion) {
    // Sin radio (o sin haberse podido geocodificar): filtro de texto
    // simple por ciudad o código postal, sin distancia real.
    const texto = sanear(filtros.ubicacion);
    if (texto) {
      consulta = consulta.or(`club_city.ilike.%${texto}%,club_postal_code.ilike.${texto}%`);
    }
  }

  if (!usaGeo) {
    if (filtros.orden === "valor") {
      consulta = consulta.order("value", { ascending: false });
    } else if (filtros.orden === "novedad") {
      consulta = consulta.order("opportunity_created_at", { ascending: false });
    } else {
      // Orden por defecto: tramo de ficha completa y, dentro del tramo,
      // lo más reciente. Ver `OrdenBusqueda` en search-types.
      consulta = consulta
        .order("club_visibility_bucket", { ascending: false, nullsFirst: false })
        .order("opportunity_created_at", { ascending: false });
    }
    consulta = consulta.range(paginacion.offset, paginacion.offset + paginacion.limite - 1);
  } else {
    consulta = consulta.order("opportunity_created_at", { ascending: false }).limit(TAMANO_LOTE_GEO);
  }

  const { data, count } = await consulta.returns<FilaBusqueda[]>();
  let resultados = (data ?? []).map((fila) => filaAResultado(fila, centro));

  if (usaRadio) {
    resultados = resultados.filter((r) => r.distanceKm != null && r.distanceKm <= filtros.radioKm!);
  }

  if (!usaGeo) {
    const resultado = {
      resultados,
      hayMas: (count ?? 0) > paginacion.offset + paginacion.limite,
      total: count ?? resultados.length,
    };
    if (paginacion.offset === 0) await registrarBusqueda(filtros, resultado);
    return resultado;
  }

  if (filtros.orden === "valor") {
    resultados.sort((a, b) => b.value - a.value);
  } else if (filtros.orden === "novedad") {
    resultados.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filtros.orden === "cercania") {
    resultados.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else {
    // Con radio, "recomendado" sigue mandando la distancia primero (para
    // eso ha puesto un radio), y desempata la ficha más completa.
    resultados.sort((a, b) => {
      const porDistancia = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      if (porDistancia !== 0) return porDistancia;
      return b.visibilityBucket - a.visibilityBucket;
    });
  }

  const pagina = resultados.slice(paginacion.offset, paginacion.offset + paginacion.limite);
  const resultado = {
    resultados: pagina,
    hayMas: resultados.length > paginacion.offset + paginacion.limite,
    total: null,
  };
  if (paginacion.offset === 0) await registrarBusqueda(filtros, resultado);
  return resultado;
}

/**
 * Opciones de deporte/categoría/género para el panel de filtros: se
 * calculan a partir de los equipos que los clubes ya han dado de alta
 * (Fase 4), no de una lista fija, porque esos campos son texto libre en
 * `club_teams`.
 */
export async function obtenerOpcionesEquipo(): Promise<{
  deportes: string[];
  categorias: string[];
  generos: string[];
}> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("club_teams")
    .select("sport, category, gender")
    .returns<{ sport: string; category: string | null; gender: string | null }[]>();

  const filas = data ?? [];
  const unico = (valores: (string | null)[]) =>
    Array.from(new Set(valores.map((valor) => valor?.trim()).filter((valor): valor is string => !!valor))).sort(
      (a, b) => a.localeCompare(b, "es"),
    );

  return {
    deportes: unico(filas.map((fila) => fila.sport)),
    categorias: unico(filas.map((fila) => fila.category)),
    generos: unico(filas.map((fila) => fila.gender)),
  };
}

/** Provincias con al menos un club, para el desplegable de ubicación. */
export async function obtenerProvinciasDisponibles(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("club_public_profiles")
    .select("province")
    .not("province", "is", null)
    .returns<{ province: string | null }[]>();

  return Array.from(new Set((data ?? []).map((fila) => fila.province).filter((valor): valor is string => !!valor))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}
