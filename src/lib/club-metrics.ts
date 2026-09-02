import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Métricas que ve el club en su panel (migración 0014).
 *
 * Todo se cuenta sobre tablas de eventos con la clave de servicio: el
 * club no lee las tablas, solo sus números ya agregados. Se comparan
 * siempre dos ventanas del mismo tamaño (los últimos 30 días contra los
 * 30 anteriores) para que la cifra signifique algo: "12 visitas" no dice
 * nada; "12 visitas, el doble que el mes pasado" sí.
 */

export type MetricaClub = {
  /** Ventana actual (últimos `dias` días). */
  actual: number;
  /** Misma ventana inmediatamente anterior. */
  anterior: number;
};

export type MetricasClub = {
  dias: number;
  apariciones: MetricaClub;
  visitas: MetricaClub;
  dossieres: MetricaClub;
  solicitudes: MetricaClub;
};

const TABLAS = {
  apariciones: "club_search_appearances",
  visitas: "club_page_views",
  dossieres: "dossier_views",
  solicitudes: "contact_requests",
} as const;

async function contar(
  tabla: string,
  clubId: string,
  desde: Date,
  hasta: Date,
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from(tabla)
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .gte("created_at", desde.toISOString())
    .lt("created_at", hasta.toISOString());

  // Un error de conteo no puede tumbar el panel entero: se enseña 0 y el
  // club ve el resto de sus datos.
  if (error) return 0;
  return count ?? 0;
}

export async function obtenerMetricasClub(
  clubId: string,
  dias = 30,
  ahora: Date = new Date(),
): Promise<MetricasClub> {
  const msVentana = dias * 24 * 60 * 60 * 1000;
  const inicioActual = new Date(ahora.getTime() - msVentana);
  const inicioAnterior = new Date(ahora.getTime() - msVentana * 2);

  const claves = Object.keys(TABLAS) as (keyof typeof TABLAS)[];

  const resultados = await Promise.all(
    claves.flatMap((clave) => [
      contar(TABLAS[clave], clubId, inicioActual, ahora),
      contar(TABLAS[clave], clubId, inicioAnterior, inicioActual),
    ]),
  );

  const porClave = Object.fromEntries(
    claves.map((clave, indice) => [
      clave,
      { actual: resultados[indice * 2], anterior: resultados[indice * 2 + 1] },
    ]),
  ) as Record<keyof typeof TABLAS, MetricaClub>;

  return { dias, ...porClave };
}

/**
 * Variación entre las dos ventanas, en porcentaje redondeado. Null
 * cuando no hay con qué comparar (el mes anterior estaba a cero): en ese
 * caso la tarjeta enseña la cifra sin porcentaje, en vez de un "+100 %"
 * que suena a truco.
 */
export function variacion({ actual, anterior }: MetricaClub): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** true si el club todavía no tiene ningún dato que enseñar. */
export function sinDatos(metricas: MetricasClub): boolean {
  return (
    metricas.apariciones.actual === 0 &&
    metricas.visitas.actual === 0 &&
    metricas.dossieres.actual === 0 &&
    metricas.solicitudes.actual === 0
  );
}
