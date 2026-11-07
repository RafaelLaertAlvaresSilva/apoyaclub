import { deporteDeLaLista } from "@/lib/deportes";
import { tienePrecio } from "@/lib/format";
import type { PaisBusqueda } from "@/lib/search-types";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Páginas para que las empresas lleguen solas desde Google (pedido por
 * Rafael el 6-11-2026): "Patrocinar clubes de fútbol en Las Palmas".
 *
 *   /patrocinar                     todos los deportes y zonas con clubes
 *   /patrocinar/<deporte>           los clubes de ese deporte
 *   /patrocinar/<deporte>/<zona>    los de ese deporte en esa provincia
 *
 * Solo existen las combinaciones que tienen al menos un club visible: una
 * página vacía no ayuda a nadie y Google la castiga. Cada idioma enseña
 * los clubes de su país (/es España, /pt Portugal, /br Brasil; en
 * inglés, todos), igual que el buscador.
 *
 * El deporte va por su clave de la lista (`lib/deportes.ts`: futbol,
 * balonmano…); un deporte escrito a mano no tiene página. La zona, por
 * la provincia o el estado del club, sin tildes ni espacios.
 */

export type ClubDePatrocinio = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  province: string | null;
  country: string | null;
  logoUrl: string | null;
  description: string | null;
  /** Claves de los deportes de la lista que tienen sus equipos. */
  deportes: string[];
  oportunidades: number;
  /** El precio más bajo de lo que ofrece, en su moneda; null si nada lleva precio. */
  desde: number | null;
};

/** "Las Palmas" → "las-palmas"; "Pernambuco (PE)" → "pernambuco-pe". */
export function slugDeZona(provincia: string): string {
  return provincia
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Todos los clubes visibles, con sus deportes y lo que ofrecen. */
export async function clubesParaPatrocinar(): Promise<ClubDePatrocinio[]> {
  const supabase = createPublicClient();
  const [{ data: clubes }, { data: equipos }, { data: oportunidades }] = await Promise.all([
    supabase
      .from("club_public_profiles")
      .select("*")
      .not("slug", "is", null)
      .returns<
        {
          id: string;
          slug: string;
          name: string;
          city: string | null;
          province: string | null;
          country?: string | null;
          logo_url: string | null;
          description: string | null;
        }[]
      >(),
    supabase.from("club_teams").select("club_id, sport").returns<{ club_id: string; sport: string | null }[]>(),
    supabase
      .from("opportunity_search_view")
      .select("club_id, value, is_need")
      .returns<{ club_id: string; value: number | string; is_need: boolean | null }[]>(),
  ]);

  const deportesPorClub = new Map<string, Set<string>>();
  for (const equipo of equipos ?? []) {
    const deporte = deporteDeLaLista(equipo.sport);
    if (!deporte) continue;
    const suyos = deportesPorClub.get(equipo.club_id) ?? new Set<string>();
    suyos.add(deporte.clave);
    deportesPorClub.set(equipo.club_id, suyos);
  }

  const ofertasPorClub = new Map<string, { total: number; desde: number | null }>();
  for (const fila of oportunidades ?? []) {
    const cuenta = ofertasPorClub.get(fila.club_id) ?? { total: 0, desde: null };
    cuenta.total += 1;
    const valor = typeof fila.value === "string" ? Number.parseFloat(fila.value) : fila.value;
    if (tienePrecio({ value: valor, esNecesidad: !!fila.is_need })) {
      cuenta.desde = cuenta.desde == null ? valor : Math.min(cuenta.desde, valor);
    }
    ofertasPorClub.set(fila.club_id, cuenta);
  }

  return (clubes ?? []).map((club) => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    city: club.city,
    province: club.province,
    country: club.country ?? null,
    logoUrl: club.logo_url,
    description: club.description,
    deportes: [...(deportesPorClub.get(club.id) ?? [])],
    oportunidades: ofertasPorClub.get(club.id)?.total ?? 0,
    desde: ofertasPorClub.get(club.id)?.desde ?? null,
  }));
}

/** Los clubes del país de la página ("todos" no filtra; sin país, España). */
export function delPais(clubes: ClubDePatrocinio[], pais: PaisBusqueda): ClubDePatrocinio[] {
  if (pais === "todos") return clubes;
  return clubes.filter((club) => (club.country ?? "ES") === pais);
}

/**
 * Los clubes de un deporte y, si se pide, de una zona. Primero los que
 * más ofrecen: son los que le sirven a una empresa que llega de Google.
 */
export function clubesDe(clubes: ClubDePatrocinio[], deporte: string, zona?: string): ClubDePatrocinio[] {
  return clubes
    .filter((club) => club.deportes.includes(deporte))
    .filter((club) => !zona || (club.province != null && slugDeZona(club.province) === zona))
    .sort((a, b) => b.oportunidades - a.oportunidades || a.name.localeCompare(b.name, "es"));
}

export type Combinacion = { deporte: string; zona: string | null; nombreZona: string | null; clubes: number };

/** Todas las páginas que existen: cada deporte, y cada deporte en cada zona. */
export function combinaciones(clubes: ClubDePatrocinio[]): Combinacion[] {
  const porDeporte = new Map<string, number>();
  const porZona = new Map<string, Combinacion>();
  for (const club of clubes) {
    for (const deporte of club.deportes) {
      porDeporte.set(deporte, (porDeporte.get(deporte) ?? 0) + 1);
      if (!club.province) continue;
      const zona = slugDeZona(club.province);
      if (!zona) continue;
      const clave = `${deporte}/${zona}`;
      const actual = porZona.get(clave) ?? { deporte, zona, nombreZona: club.province, clubes: 0 };
      actual.clubes += 1;
      porZona.set(clave, actual);
    }
  }
  return [
    ...[...porDeporte].map(([deporte, n]) => ({ deporte, zona: null, nombreZona: null, clubes: n })),
    ...porZona.values(),
  ].sort((a, b) => b.clubes - a.clubes || a.deporte.localeCompare(b.deporte));
}
