import type { ClubProfile, ClubTeam } from "@/lib/types";

/**
 * Los tres pasos del primer día de un club.
 *
 * La barra de progreso del perfil dice cuánto falta, pero no por dónde
 * empezar: un club que acaba de registrarse aterriza en un panel vacío y
 * decide solo. Esto le da un orden — identidad, equipos, primera
 * oportunidad — y desaparece en cuanto los tres están hechos, para no
 * estorbar al club que ya lleva meses.
 *
 * Función pura para poder probarla: la decisión de qué está hecho no
 * depende de cómo se pinte.
 */

export type PasoInicial = {
  id: "identidad" | "equipos" | "oportunidad";
  hecho: boolean;
  /** Ruta a la que lleva el paso cuando está pendiente. */
  href: string;
};

export function primerosPasos(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  oportunidadesPublicadas: number,
): PasoInicial[] {
  return [
    {
      id: "identidad",
      // Con logo y descripción la página ya se puede enseñar; el resto
      // del perfil suma, pero no bloquea.
      hecho: !!perfil?.logoUrl && !!perfil?.description,
      href: "/panel",
    },
    {
      id: "equipos",
      hecho: equipos.length > 0 || perfil?.youthTeamsCount != null,
      href: "/panel",
    },
    {
      id: "oportunidad",
      hecho: oportunidadesPublicadas > 0,
      href: "/panel/oportunidades",
    },
  ];
}

/** true cuando ya no hay nada que enseñar: los tres pasos están hechos. */
export function onboardingCompleto(pasos: PasoInicial[]): boolean {
  return pasos.every((paso) => paso.hecho);
}

/** Primer paso pendiente, que es el que se destaca. Null si no queda ninguno. */
export function siguientePaso(pasos: PasoInicial[]): PasoInicial | null {
  return pasos.find((paso) => !paso.hecho) ?? null;
}
