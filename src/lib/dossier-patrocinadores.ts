import { NIVELES_PATROCINADOR, etiquetaNivelPatrocinador } from "@/lib/types";
import type { ClubSponsor, SponsorTier } from "@/lib/types";

/**
 * Qué patrocinadores salen en el dossier y cómo (migraciones 0056 y,
 * desde el 5-11-2026, las opciones de `dossier-opciones.ts`).
 *
 * El club elige por nivel: todos, solo el principal, principal y
 * oficiales… Y elige también:
 *
 *   - Con logo o solo con el nombre. Por defecto solo el nombre: con
 *     logo, un club con muchos patrocinadores ocupa páginas. Aun con
 *     logo, un nivel con más de `MAXIMO_CON_LOGO` sale solo con nombres,
 *     porque metidos a la fuerza se pisaban unos con otros.
 *   - Separados por categoría (principal, oficial, colaborador…) o todos
 *     en una sola lista.
 *   - Dentro de cada grupo, por orden alfabético. Es lo que pidió el
 *     club: nadie tiene que preguntar por qué una tienda va antes que
 *     otra.
 */
/** A partir de aquí, un nivel con logo pasa a ir solo con el nombre. */
export const MAXIMO_CON_LOGO = 9;

export type GrupoDePatrocinadores = {
  /** Null cuando van todos juntos, sin separar por categoría. */
  nivel: SponsorTier | null;
  /** "Patrocinador principal", o la etiqueta propia de un nivel "otro".
   * Vacía cuando van todos juntos: el grupo no lleva título. */
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
  { conLogos = false, separar = true }: { conLogos?: boolean; separar?: boolean } = {},
): GrupoDePatrocinadores[] {
  const elegidos = niveles ?? NIVELES_PATROCINADOR;
  const alfabetico = new Intl.Collator(intlLocale, { sensitivity: "base", numeric: true });
  const porNombre = (a: ClubSponsor, b: ClubSponsor) => alfabetico.compare(a.name.trim(), b.name.trim());
  const llevaLogo = (lista: ClubSponsor[]) => conLogos && lista.length <= MAXIMO_CON_LOGO;

  if (!separar) {
    const todos = patrocinadores.filter((patrocinador) => elegidos.includes(patrocinador.tier)).sort(porNombre);
    return todos.length > 0 ? [{ nivel: null, etiqueta: "", conLogo: llevaLogo(todos), patrocinadores: todos }] : [];
  }

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
        .sort(porNombre);
      grupos.push({ nivel, etiqueta, conLogo: llevaLogo(lista), patrocinadores: lista });
    }
  }
  return grupos;
}

/** Parte una lista en filas de `columnas` elementos, para las rejillas. */
export function enFilas<T>(lista: T[], columnas: number): T[][] {
  const filas: T[][] = [];
  for (let indice = 0; indice < lista.length; indice += columnas) filas.push(lista.slice(indice, indice + columnas));
  return filas;
}
