import { getLocale, getTranslations } from "next-intl/server";
import { calcularAlcance, cifraLlana, cifrasParaVender } from "@/lib/alcance";
import type { clubRowToProfile, clubTeamRowToTeam } from "@/lib/club-mappers";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import { intlLocaleDe } from "@/config/locales";
import type { createClient } from "@/lib/supabase/server";

// Fuera de la página para poder usarla también en el asistente de
// primeros pasos (`/panel/empezar`), que enseña el mismo generador.

/**
 * "Datos del Club…: Público de media en casa: 200 · Jugadores: 52…", la
 * línea que cierra cada propuesta generada. Las mismas cifras que la
 * portada del dossier. Null si el club todavía no tiene ninguna.
 */
export async function lineaDeDatosDelClub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  perfil: NonNullable<ReturnType<typeof clubRowToProfile>>,
  equipos: ReturnType<typeof clubTeamRowToTeam>[],
): Promise<string | null> {
  const [tAlcance, tGen, locale] = await Promise.all([
    getTranslations("panel.alcance.informe"),
    getTranslations("panel.oportunidades.generador"),
    getLocale(),
  ]);
  const intlLocale = intlLocaleDe(locale);
  const partidos = await obtenerPartidosDelClub(supabase, clubId).catch(() => []);
  const alcance = calcularAlcance(
    { perfil, equipos, partidos },
    (clave, valores) => tAlcance(clave, valores as never),
    intlLocale,
  );
  const cifras = cifrasParaVender(alcance)
    .map((cifra) => `${cifra.etiqueta}: ${cifraLlana(cifra.valor, intlLocale)}`)
    .join(" · ");
  return cifras ? tGen("datos", { club: perfil.name, cifras }) : null;
}
