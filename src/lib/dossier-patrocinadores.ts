import { NIVELES_PATROCINADOR, etiquetaNivelPatrocinador } from "@/lib/types";
import type { ClubSponsor, SponsorTier } from "@/lib/types";

/**
 * Qué patrocinadores salen en el dossier y cómo (migración 0056).
 *
 * El club elige por nivel: todos, solo el principal, principal y
 * oficiales… Un club con treinta colaboradores no los cabe con logo en
 * una página, y metidos a la fuerza se pisaban unos con otros. Así que:
 *
 *   - El principal y los oficiales salen con su logo, que es lo que
 *     pagan, siempre que sean pocos (hasta `MAXIMO_CON_LOGO` por nivel).
 *   - El resto sale solo con el nombre, en columnas: caben muchos en
 *     poco sitio y se leen de un vistazo.
 *   - Dentro de cada nivel, por orden alfabético. Es lo que pidió el
 *     club: nadie tiene que preguntar por qué una tienda va antes que
 *     otra.
 */

/** A partir de aquí, un nivel con logo pasa a ir solo con el nombre. */
export const MAXIMO_CON_LOGO = 9;

/** Cuántos nombres caben en la portada antes del "y N más". */
export const NOMBRES_EN_PORTADA = 8;

const CON_LOGO: SponsorTier[] = ["principal", "oficial"];

export type GrupoDePatrocinadores = {
  nivel: SponsorTier;
  /** "Patrocinador principal", o la etiqueta propia de un nivel "otro". */
  etiqueta: string;
  conLogo: boolean;
  patrocinadores: ClubSponsor[];
};

/** Deja solo niveles que existen, sin repetir y en el orden de siempre. */
export function nivelesValidos(valores: unknown[]): SponsorTier[] {
  const pedidos = new Set(valores.map(String));
  return NIVELES_PATROCINADOR.filter((nivel) => pedidos.has(nivel));
}

/**
 * Los patrocinadores de los niveles elegidos, agrupados por la etiqueta
 * que se enseña y en orden alfabético dentro de cada grupo.
 *
 * `niveles` a null quiere decir "todos": es lo que tiene un club que no
 * ha tocado nunca la opción, y lo que lee el enlace público si la
 * migración 0056 todavía no se ha ejecutado.
 */
export function patrocinadoresDelDossier(
  patrocinadores: ClubSponsor[],
  niveles: SponsorTier[] | null,
  intlLocale = "es-ES",
): GrupoDePatrocinadores[] {
  const elegidos = niveles ?? NIVELES_PATROCINADOR;
  const alfabetico = new Intl.Collator(intlLocale, { sensitivity: "base", numeric: true });

  const grupos: GrupoDePatrocinadores[] = [];
  for (const nivel of NIVELES_PATROCINADOR) {
    if (!elegidos.includes(nivel)) continue;
    const delNivel = patrocinadores.filter((patrocinador) => patrocinador.tier === nivel);

    // Los de nivel "otro" llevan cada uno la etiqueta que les puso el
    // club ("Amigos del club", "Proveedores"): un grupo por etiqueta.
    const etiquetas = Array.from(new Set(delNivel.map(etiquetaNivelPatrocinador))).sort(alfabetico.compare);
    for (const etiqueta of etiquetas) {
      const lista = delNivel
        .filter((patrocinador) => etiquetaNivelPatrocinador(patrocinador) === etiqueta)
        .sort((a, b) => alfabetico.compare(a.name.trim(), b.name.trim()));
      grupos.push({
        nivel,
        etiqueta,
        conLogo: CON_LOGO.includes(nivel) && lista.length <= MAXIMO_CON_LOGO,
        patrocinadores: lista,
      });
    }
  }
  return grupos;
}

/** Los nombres de la portada: primero los de más nivel, y cuántos quedan fuera. */
export function nombresDePortada(grupos: GrupoDePatrocinadores[]): { nombres: string[]; resto: number } {
  const todos = grupos.flatMap((grupo) => grupo.patrocinadores.map((patrocinador) => patrocinador.name.trim()));
  return { nombres: todos.slice(0, NOMBRES_EN_PORTADA), resto: Math.max(0, todos.length - NOMBRES_EN_PORTADA) };
}

/** Parte una lista en filas de `columnas` elementos, para las rejillas. */
export function enFilas<T>(lista: T[], columnas: number): T[][] {
  const filas: T[][] = [];
  for (let indice = 0; indice < lista.length; indice += columnas) filas.push(lista.slice(indice, indice + columnas));
  return filas;
}
