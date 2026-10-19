import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Si un club está en modo de pruebas (migración 0053): conserva su
 * panel, pero no se ve en ningún sitio público.
 *
 * Va en una consulta aparte, y no metida en el `select` de cada página,
 * a propósito: si el código llega a la web antes de que se ejecute la
 * migración, la columna todavía no existe y la consulta falla. Metida
 * en otra consulta, ese fallo se llevaría por delante datos que no
 * tienen nada que ver (la ficha del club, su suscripción, su contacto).
 * Aquí, un fallo se lee como "no está en pruebas", que es exactamente
 * lo que era el club antes de que existiera el modo.
 */
export async function estaEnModoPruebas(supabase: SupabaseClient, clubId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("clubs")
    .select("admin_test_mode")
    .eq("id", clubId)
    .maybeSingle<{ admin_test_mode: boolean | null }>();

  if (error || !data) return false;
  return data.admin_test_mode === true;
}
