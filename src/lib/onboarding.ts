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
  /**
   * Pestaña del propio panel que abre el paso, o null si lleva a otra
   * página.
   *
   * Se distingue de `href` porque el botón tiene que pintarse distinto:
   * un enlace de Next navega cambiando el historial sin avisar al
   * navegador, y un salto dentro de la misma página no se entera. Los
   * pasos con ancla se pintan como enlace normal (`<a href="#equipos">`),
   * que sí dispara el aviso que `PanelTabs` escucha.
   */
  anclaDelPanel: "identidad" | "equipos" | null;
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
      href: "/panel#identidad",
      anclaDelPanel: "identidad",
    },
    {
      id: "equipos",
      hecho: equipos.length > 0 || perfil?.youthTeamsCount != null,
      href: "/panel#equipos",
      anclaDelPanel: "equipos",
    },
    {
      id: "oportunidad",
      hecho: oportunidadesPublicadas > 0,
      href: "/panel/oportunidades",
      anclaDelPanel: null,
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
