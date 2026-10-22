import type { SupabaseClient } from "@supabase/supabase-js";

/** Por qué un club con la suscripción en regla no se ve en público. */
export type VisibilidadDelClub = {
  /** Lo ha puesto el administrador (migración 0053). */
  modoPruebas: boolean;
  /** Lo ha decidido el propio club desde su panel (migración 0055). */
  ocultoPorElClub: boolean;
};

const VISIBLE: VisibilidadDelClub = { modoPruebas: false, ocultoPorElClub: false };

/**
 * Si un club está escondido del público aunque pague: en modo de
 * pruebas, o porque él mismo ha decidido no mostrarse.
 *
 * Va en una consulta aparte, y no metida en el `select` de cada página,
 * a propósito: si el código llega a la web antes de que se ejecute la
 * migración, la columna todavía no existe y la consulta falla. Metida
 * en otra consulta, ese fallo se llevaría por delante datos que no
 * tienen nada que ver (la ficha del club, su suscripción, su contacto).
 * Aquí, un fallo se lee como "visible", que es exactamente lo que era
 * el club antes de que existieran estas dos opciones.
 */
export async function leerVisibilidadDelClub(
  supabase: SupabaseClient,
  clubId: string,
): Promise<VisibilidadDelClub> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .maybeSingle<{ admin_test_mode?: boolean | null; hidden_by_club?: boolean | null }>();

  if (error || !data) return VISIBLE;
  return { modoPruebas: data.admin_test_mode === true, ocultoPorElClub: data.hidden_by_club === true };
}

/** Atajo: si el club no se ve en público por cualquiera de los dos motivos. */
export async function estaEscondido(supabase: SupabaseClient, clubId: string): Promise<boolean> {
  const { modoPruebas, ocultoPorElClub } = await leerVisibilidadDelClub(supabase, clubId);
  return modoPruebas || ocultoPorElClub;
}

/** Se mantiene por compatibilidad: solo el modo de pruebas del administrador. */
export async function estaEnModoPruebas(supabase: SupabaseClient, clubId: string): Promise<boolean> {
  return (await leerVisibilidadDelClub(supabase, clubId)).modoPruebas;
}
