import type { BudgetPeriod, CollaborationType, ObjectiveTag, OpportunityType, TeamLevel } from "@/lib/types";

/**
 * Tipos y funciones puras del buscador (Fase 7), separados de
 * `lib/search.ts` para que se puedan importar también desde componentes
 * de cliente (el panel de filtros, el toggle de vista) sin arrastrar el
 * cliente de Supabase al bundle del navegador. `lib/search.ts` (solo
 * servidor) reexporta todo lo de aquí.
 */

export type OrdenBusqueda = "cercania" | "valor" | "novedad";
export type VistaBusqueda = "oportunidad" | "club";

export type FiltrosBusqueda = {
  provincia?: string;
  /** Ciudad o código postal, en texto libre. */
  ubicacion?: string;
  radioKm?: number;
  deporte?: string;
  categoria?: string;
  genero?: string;
  nivelEquipo?: TeamLevel;
  tipos?: OpportunityType[];
  presupuestoMin?: number;
  presupuestoMax?: number;
  periodo?: BudgetPeriod;
  formasColaboracion?: CollaborationType[];
  objetivos?: ObjectiveTag[];
  orden?: OrdenBusqueda;
};

export type ResultadoOportunidad = {
  opportunityId: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  clubCity: string;
  clubProvince: string | null;
  clubLogoUrl: string | null;
  title: string;
  description: string | null;
  opportunityType: OpportunityType;
  value: number;
  duration: string | null;
  period: BudgetPeriod | null;
  collaborationType: CollaborationType | null;
  objectives: ObjectiveTag[];
  createdAt: string;
  /** Distancia al centro de búsqueda, o null si no había radio activo o el club no está geocodificado. */
  distanceKm: number | null;
};

export type ResultadoClub = {
  clubId: string;
  clubSlug: string;
  clubName: string;
  clubCity: string;
  clubProvince: string | null;
  clubLogoUrl: string | null;
  distanceKm: number | null;
  opportunitiesCount: number;
  minValue: number;
  maxValue: number;
  opportunityTypes: OpportunityType[];
  /** Las 3 oportunidades de mayor valor del club, para la vista previa de la tarjeta. */
  topOpportunities: ResultadoOportunidad[];
};

export type PaginaBusqueda<T> = {
  resultados: T[];
  hayMas: boolean;
  /** null cuando no se puede calcular con exactitud (búsqueda con radio u orden por cercanía). */
  total: number | null;
};

/** Agrupa resultados de oportunidad en resultados por club (vista "por club" del buscador). */
export function agruparPorClub(oportunidades: ResultadoOportunidad[]): ResultadoClub[] {
  const mapa = new Map<string, ResultadoClub>();

  for (const oportunidad of oportunidades) {
    let club = mapa.get(oportunidad.clubId);
    if (!club) {
      club = {
        clubId: oportunidad.clubId,
        clubSlug: oportunidad.clubSlug,
        clubName: oportunidad.clubName,
        clubCity: oportunidad.clubCity,
        clubProvince: oportunidad.clubProvince,
        clubLogoUrl: oportunidad.clubLogoUrl,
        distanceKm: oportunidad.distanceKm,
        opportunitiesCount: 0,
        minValue: oportunidad.value,
        maxValue: oportunidad.value,
        opportunityTypes: [],
        topOpportunities: [],
      };
      mapa.set(oportunidad.clubId, club);
    }

    club.opportunitiesCount += 1;
    club.minValue = Math.min(club.minValue, oportunidad.value);
    club.maxValue = Math.max(club.maxValue, oportunidad.value);
    if (!club.opportunityTypes.includes(oportunidad.opportunityType)) {
      club.opportunityTypes.push(oportunidad.opportunityType);
    }
    if (club.topOpportunities.length < 3) club.topOpportunities.push(oportunidad);
  }

  return Array.from(mapa.values());
}
