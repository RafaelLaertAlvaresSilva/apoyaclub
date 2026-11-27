import type { ClubProfile, ClubTeam } from "@/lib/types";

/**
 * Los primeros pasos de un club: los mismos cinco del asistente
 * (`/panel/empezar`) y de la lista "Empieza por aquí" del inicio.
 *
 * Hasta el 27-11-2026 eran dos listas distintas —cuatro pasos en el
 * inicio y cinco en el asistente— y un mismo club veía "3 de 4" en un
 * sitio y "4 de 5" en el otro. Ahora salen de aquí las dos.
 *
 * Función pura para poder probarla: la decisión de qué está hecho no
 * depende de cómo se pinte.
 */

export const IDS_PASOS = ["club", "imagenes", "equipos", "oportunidades", "compartir"] as const;
export type IdPaso = (typeof IDS_PASOS)[number];

export type PasoInicial = {
  id: IdPaso;
  hecho: boolean;
  /** El paso del asistente que lo resuelve. */
  href: string;
};

export function primerosPasos(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  oportunidadesPublicadas: number,
  /** Si ya ha abierto su dossier (hay fila en `club_dossiers`). */
  tieneDossier = false,
): PasoInicial[] {
  const hecho: Record<IdPaso, boolean> = {
    // Con nombre y unas líneas la página ya se puede enseñar.
    club: !!perfil?.name && !!perfil?.description,
    imagenes: !!perfil?.logoUrl && !!perfil?.coverUrl,
    // Los datos de cantera cuentan: hay clubes que solo tienen base.
    equipos: equipos.length > 0 || perfil?.youthTeamsCount != null,
    oportunidades: oportunidadesPublicadas > 0,
    compartir: tieneDossier,
  };
  return IDS_PASOS.map((id, indice) => ({ id, hecho: hecho[id], href: `/panel/empezar?paso=${indice + 1}` }));
}

/** true cuando ya no hay nada que enseñar: todos los pasos están hechos. */
export function onboardingCompleto(pasos: PasoInicial[]): boolean {
  return pasos.every((paso) => paso.hecho);
}

/** Primer paso pendiente, que es el que se destaca. Null si no queda ninguno. */
export function siguientePaso(pasos: PasoInicial[]): PasoInicial | null {
  return pasos.find((paso) => !paso.hecho) ?? null;
}
