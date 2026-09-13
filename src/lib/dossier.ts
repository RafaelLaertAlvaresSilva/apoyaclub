import type { Partido } from "@/lib/publico-partidos";
import type { ClubProfile, ClubSponsor, ClubTeam, DossierSectionKey } from "@/lib/types";

/**
 * Constantes y helpers del dossier PDF (Fase 9), compartidos por el
 * panel (selector de secciones) y el generador de PDF.
 */

export const SECCIONES_DOSSIER: { id: DossierSectionKey; etiqueta: string; descripcion: string }[] = [
  { id: "identidad", etiqueta: "Identidad", descripcion: "Quiénes somos, ubicación y contacto." },
  { id: "historia", etiqueta: "Historia", descripcion: "Año de fundación e hitos." },
  { id: "equipos", etiqueta: "Equipos", descripcion: "Deporte, categoría y nivel de cada equipo." },
  { id: "cantera", etiqueta: "Cantera", descripcion: "Equipos, jugadores y familias (datos agregados)." },
  {
    id: "audiencia",
    etiqueta: "Audiencia",
    descripcion: "A cuánta gente llegas, con el origen de cada cifra y sin sumar unas con otras.",
  },
  { id: "instalaciones", etiqueta: "Instalaciones", descripcion: "Descripción de las instalaciones del club." },
  { id: "patrocinadores", etiqueta: "Patrocinadores actuales", descripcion: "Marcas que ya confían en el club." },
];

export const ETIQUETA_SECCION_DOSSIER: Record<DossierSectionKey, string> = SECCIONES_DOSSIER.reduce(
  (acumulado, seccion) => ({ ...acumulado, [seccion.id]: seccion.etiqueta }),
  {} as Record<DossierSectionKey, string>,
);

/**
 * Qué secciones tienen contenido real que mostrar, con el mismo
 * criterio que la página pública del club (`club/[slug]/page.tsx`): no
 * se ofrece incluir una sección vacía en el dossier.
 */
export function seccionesConContenido(
  perfil: ClubProfile,
  equipos: ClubTeam[],
  patrocinadores: ClubSponsor[],
  partidos: Partido[] = [],
): Set<DossierSectionKey> {
  const disponibles = new Set<DossierSectionKey>();

  if (perfil.description || perfil.photoUrls.length > 0 || perfil.website || perfil.videoUrl) {
    disponibles.add("identidad");
  }
  if (perfil.foundingYear != null || perfil.milestones.length > 0) {
    disponibles.add("historia");
  }
  if (equipos.length > 0) {
    disponibles.add("equipos");
  }
  if (
    perfil.youthTeamsCount != null ||
    perfil.youthPlayersCount != null ||
    perfil.youthFamiliesCount != null
  ) {
    disponibles.add("cantera");
  }
  // La audiencia ya no depende solo de lo que el club escriba en su
  // ficha: un club que solo apunta el público de sus partidos tiene la
  // mejor cifra de todas y antes se quedaba sin sección.
  if (
    partidos.length > 0 ||
    perfil.membersCount != null ||
    perfil.estimatedReach != null ||
    perfil.averageAttendance != null ||
    Object.values(perfil.followersByNetwork).some((valor) => valor != null)
  ) {
    disponibles.add("audiencia");
  }
  if (perfil.facilities) {
    disponibles.add("instalaciones");
  }
  if (patrocinadores.length > 0) {
    disponibles.add("patrocinadores");
  }

  return disponibles;
}

/** Selección por defecto la primera vez que un club abre el dossier:
 * todas las secciones que ya tienen contenido. */
export function seccionesPorDefecto(disponibles: Set<DossierSectionKey>): DossierSectionKey[] {
  return SECCIONES_DOSSIER.map((seccion) => seccion.id).filter((id) => disponibles.has(id));
}

/** Igual que `deportesDelClub` en `app/club/[slug]/data.ts`: no hay un
 * campo "deporte" a nivel de club, así que se calcula a partir de los
 * deportes de sus equipos. Se duplica aquí (helper puro, sin datos) para
 * no importar código de `app/` desde `lib/`. */
export function deportesDelClub(equipos: ClubTeam[]): string[] {
  return Array.from(new Set(equipos.map((equipo) => equipo.sport.trim()).filter(Boolean)));
}
