import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * El programa piloto de la campaña de Instagram (migración 0057): los
 * clubes que se registran desde apoyaclub.com/piloto tienen 6 meses de
 * prueba gratis en vez de 30 días, mientras queden plazas.
 *
 * Para cambiar el número de plazas basta con tocar esta línea: la
 * página y el registro leen de aquí.
 */
export const PLAZAS_PILOTO = 20;

/** Meses gratis del piloto. Tiene que coincidir con la migración 0057. */
export const MESES_PILOTO = 6;

/**
 * Cuántas plazas quedan. Null si no se puede saber (por ejemplo, si la
 * migración 0057 todavía no se ha ejecutado): en ese caso la página no
 * enseña el contador y el registro no marca a nadie como piloto, porque
 * sin la migración la prueba duraría 30 días igualmente.
 */
export async function plazasPilotoLibres(admin: SupabaseClient): Promise<number | null> {
  try {
    const { data, error } = await admin.rpc("plazas_piloto_ocupadas");
    if (error || typeof data !== "number") return null;
    return Math.max(0, PLAZAS_PILOTO - data);
  } catch {
    return null;
  }
}

/** Si la cuenta se apuntó al piloto (lo marca el servidor en `app_metadata`). */
export function esDelPiloto(appMetadata: Record<string, unknown> | null | undefined): boolean {
  return appMetadata?.piloto === true;
}
