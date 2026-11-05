import type { CifraDeAlcance } from "@/lib/alcance";
import type { ClubProfile } from "@/lib/types";

/**
 * Que el dossier no diga lo mismo dos veces (pedido por Rafael el
 * 5-11-2026). Antes:
 *
 *   - la descripción del club salía resumida en la portada y entera en
 *     "Quiénes somos";
 *   - las cifras de la portada (público, jugadores, familias…) volvían a
 *     salir en "Audiencia", primero en frases y luego en tarjetas, y
 *     jugadores y familias otra vez en "Cantera": hasta tres veces;
 *   - los patrocinadores salían en la portada y en su apartado.
 *
 * La regla: cada dato, una vez, y en el sitio más visible de los que
 * van. La portada se queda con las cifras clave y el resto de apartados
 * enseña lo que ella no ha enseñado. Lo comparten el PDF y el Word.
 */
export type Reparto = {
  /** El resumen de la descripción en la portada: solo si no va "Quiénes somos". */
  resumenEnPortada: boolean;
  /** Las tarjetas de "Audiencia", sin las que ya están en la portada. */
  cifrasAudiencia: CifraDeAlcance[];
  /** Las frases "en cristiano" de "Audiencia": no, si repiten la portada. */
  frasesLlanas: string[];
  /** Qué tarjetas de "Cantera" salen. */
  cantera: { equipos: boolean; jugadores: boolean; familias: boolean };
};

export function repartoSinRepetir({
  perfil,
  vaIdentidad,
  cifrasPortada,
  cifrasAudiencia,
  frasesLlanas,
}: {
  perfil: Pick<ClubProfile, "description" | "youthTeamsCount" | "youthPlayersCount" | "youthFamiliesCount">;
  vaIdentidad: boolean;
  cifrasPortada: CifraDeAlcance[];
  cifrasAudiencia: CifraDeAlcance[];
  frasesLlanas: string[];
}): Reparto {
  const enPortada = new Map(cifrasPortada.map((cifra) => [cifra.id, cifra.valor]));
  // La misma cifra con el mismo valor: la de "Cantera" sale del mismo
  // dato del perfil que la de la portada.
  const yaEnPortada = (id: string, valor: number | null) => valor != null && enPortada.get(id) === valor;

  return {
    resumenEnPortada: !vaIdentidad && !!perfil.description,
    cifrasAudiencia: cifrasAudiencia.filter((cifra) => !enPortada.has(cifra.id)),
    // Las frases cuentan con palabras las mismas cifras de la portada
    // (público, jugadores, familias, la red mayor). Si la portada ya las
    // enseña, sobran; si no lleva cifras, son la mejor forma de decirlas.
    frasesLlanas: cifrasPortada.length > 0 ? [] : frasesLlanas,
    cantera: {
      equipos: perfil.youthTeamsCount != null && !yaEnPortada("equipos", perfil.youthTeamsCount),
      jugadores: perfil.youthPlayersCount != null && !yaEnPortada("jugadores", perfil.youthPlayersCount),
      familias: perfil.youthFamiliesCount != null && !yaEnPortada("familias", perfil.youthFamiliesCount),
    },
  };
}
