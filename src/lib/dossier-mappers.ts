import type { DossierConfig, DossierSectionKey } from "@/lib/types";

/**
 * Igual que `club-mappers.ts` / `opportunity-mappers.ts`: traduce entre
 * las columnas snake_case de `club_dossiers` (Fase 9) y el tipo
 * `DossierConfig` en camelCase que usa el resto de la app.
 */
export type DossierRow = {
  id: string;
  sections: string[] | null;
  opportunity_ids: string[] | null;
  share_token: string | null;
  share_enabled: boolean;
  share_expires_at: string | null;
  updated_at: string;
};

const CLAVES_SECCION: DossierSectionKey[] = [
  "identidad",
  "historia",
  "equipos",
  "cantera",
  "audiencia",
  "instalaciones",
  "patrocinadores",
];

/** Filtra a claves de sección válidas por si la configuración guardada
 * quedó desactualizada (p.ej. una sección renombrada en el código). */
export function seccionesValidas(valores: unknown[]): DossierSectionKey[] {
  return valores.filter((valor): valor is DossierSectionKey =>
    (CLAVES_SECCION as string[]).includes(String(valor)),
  );
}

export function dossierRowToConfig(row: DossierRow): DossierConfig {
  return {
    clubId: row.id,
    sections: seccionesValidas(row.sections ?? []),
    opportunityIds: (row.opportunity_ids ?? []).map(String),
    shareEnabled: row.share_enabled,
    shareToken: row.share_token,
    shareExpiresAt: row.share_expires_at,
    updatedAt: row.updated_at,
  };
}
