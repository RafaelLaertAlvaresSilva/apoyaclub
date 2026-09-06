import type { ClubProfile, ClubSponsor, ClubTeam } from "@/lib/types";

/**
 * Qué le falta al club por rellenar en su ficha.
 *
 * El porcentaje en sí ya no se calcula aquí: lo mantiene la base de
 * datos en `clubs.profile_score` (migración 0020), que es también lo que
 * usa el buscador para ordenar. Tener una única definición del número
 * evita que el panel enseñe un 80 % mientras el buscador cree otra cosa.
 *
 * Lo que sí vive aquí es la lista de huecos concretos: el porcentaje dice
 * cuánto falta, pero no qué hacer. Cada hueco es una frase accionable y
 * el motivo por el que le conviene al club, ordenados por lo que más
 * mueve la aguja: primero lo que decide si una empresa se para en la
 * ficha (logo, descripción, patrocinadores), después el detalle.
 */

/** Pestaña del panel donde se rellena cada hueco. */
export type PestanaPerfil =
  | "identidad"
  | "nivel"
  | "equipos"
  | "cantera"
  | "historia"
  | "audiencia"
  | "comunidad"
  | "patrocinadores";

export type HuecoPerfil = {
  id: string;
  /** Qué tiene que hacer el club, en imperativo. */
  titulo: string;
  /** Por qué le conviene. Sin esto el aviso es una regañina. */
  porQue: string;
  pestana: PestanaPerfil;
  /**
   * A dónde lleva el enlace de "qué te falta". Casi todos los huecos se
   * arreglan en una pestaña del perfil y van a su ancla; los
   * patrocinadores tienen sección propia desde que salieron del perfil,
   * así que ese lleva a otra página.
   */
  ruta?: string;
};

/**
 * Huecos pendientes, del que más aporta al que menos. La lista está
 * escrita a mano y no generada de los campos: el orden es una decisión
 * de producto, no el orden en que están declaradas las columnas.
 */
export function huecosDelPerfil(
  perfil: ClubProfile | null,
  equipos: ClubTeam[],
  patrocinadores: ClubSponsor[],
): HuecoPerfil[] {
  if (!perfil) return [];

  const candidatos: (HuecoPerfil & { falta: boolean })[] = [
    {
      id: "logo",
      falta: !perfil.logoUrl,
      titulo: "Sube el logo del club",
      porQue: "Es lo primero que se ve en el buscador. Sin logo, tu ficha parece incompleta.",
      pestana: "identidad",
    },
    {
      id: "descripcion",
      falta: !perfil.description,
      titulo: "Escribe una descripción del club",
      porQue: "Cuatro líneas contando quién sois. Es lo que lee la empresa antes de decidir.",
      pestana: "identidad",
    },
    {
      id: "patrocinadores",
      falta: patrocinadores.length === 0,
      titulo: "Añade tus patrocinadores actuales",
      porQue: "Ver que otras empresas ya confían en ti es lo que más convence a una nueva.",
      pestana: "patrocinadores",
      ruta: "/panel/patrocinadores",
    },
    {
      id: "equipos",
      falta: equipos.length === 0,
      titulo: "Da de alta tus equipos",
      porQue: "Sin equipos, una empresa no sabe a cuánta gente llega su patrocinio.",
      pestana: "equipos",
    },
    {
      id: "fotos",
      falta: perfil.photoUrls.length === 0,
      titulo: "Sube fotos del club",
      porQue: "Una foto de un partido lleno vale más que cualquier dato.",
      pestana: "identidad",
    },
    {
      id: "cantera",
      falta:
        perfil.youthTeamsCount == null &&
        perfil.youthPlayersCount == null &&
        perfil.youthFamiliesCount == null,
      titulo: "Rellena los datos de cantera",
      porQue: "Niños y familias es lo que compra el comercio de barrio: son clientes cerca.",
      pestana: "cantera",
    },
    {
      id: "audiencia",
      falta:
        !Object.values(perfil.followersByNetwork).some((valor) => valor != null) &&
        perfil.estimatedReach == null &&
        perfil.averageAttendance == null,
      titulo: "Añade tu audiencia y seguidores",
      porQue: "Es el número que la empresa compara con lo que le cuesta un anuncio.",
      pestana: "audiencia",
    },
    {
      id: "redes",
      falta: !Object.values(perfil.socialLinks).some(Boolean),
      titulo: "Enlaza tus redes sociales",
      porQue: "La empresa entra a mirarlas antes de escribirte.",
      pestana: "identidad",
    },
    {
      id: "nivel",
      falta:
        !perfil.topCategory &&
        !perfil.topCategoryMale &&
        !perfil.topCategoryFemale &&
        !perfil.competitions,
      titulo: "Indica en qué categoría y competiciones juegas",
      porQue: "Sitúa al club: no es lo mismo una liga autonómica que una nacional.",
      pestana: "nivel",
    },
    {
      id: "historia",
      falta: perfil.foundingYear == null && perfil.milestones.length === 0,
      titulo: "Cuenta la historia del club",
      porQue: "Año de fundación y dos hitos. Los años de vida dan confianza.",
      pestana: "historia",
    },
    {
      id: "comunidad",
      falta: perfil.communityActions.length === 0,
      titulo: "Añade lo que hacéis por la comunidad",
      porQue: "Muchas empresas patrocinan por esto, no por la publicidad.",
      pestana: "comunidad",
    },
    {
      id: "web",
      falta: !perfil.website,
      titulo: "Pon la web del club",
      porQue: "Si no tenéis, sirve la página de Facebook o Instagram.",
      pestana: "identidad",
    },
    {
      id: "video",
      falta: !perfil.videoUrl,
      titulo: "Añade un vídeo",
      porQue: "Un minuto de partido o de resumen de temporada.",
      pestana: "identidad",
    },
    {
      id: "logros",
      falta: !perfil.achievements,
      titulo: "Escribe vuestros logros",
      porQue: "Ascensos, títulos, participaciones. Da igual lo pequeño.",
      pestana: "nivel",
    },
  ];

  return candidatos
    .filter((candidato) => candidato.falta)
    .map((candidato) => ({
      id: candidato.id,
      titulo: candidato.titulo,
      porQue: candidato.porQue,
      pestana: candidato.pestana,
    }));
}

/**
 * Umbral por debajo del cual la ficha se considera demasiado vacía para
 * competir en el buscador, y por tanto merece un aviso al club. No es un
 * castigo: por debajo de esto la empresa no tiene con qué decidir.
 */
export const UMBRAL_FICHA_FLOJA = 60;

/** true cuando conviene avisar al club de que le falta información. */
export function convieneAvisar(profileScore: number): boolean {
  return profileScore < UMBRAL_FICHA_FLOJA;
}
