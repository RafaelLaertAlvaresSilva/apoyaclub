import { avisarDeFallo } from "@/lib/monitoring";
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
  /** Aperturas de los datos de contacto (migración 0022). */
  contactos: MetricaClub;
  /**
   * Visitas a la ficha desde que el club está en ApoyaClub, sin ventana
   * de tiempo. Las demás cifras miran solo los últimos 30 días, que es
   * lo correcto para ver la tendencia, pero deja al club sin saber
   * nunca cuánta gente ha pasado por su página en total — que es la
   * pregunta que hace todo el mundo primero.
   */
  visitasTotales: number;
};

const TABLAS = {
  apariciones: "club_search_appearances",
  visitas: "club_page_views",
  dossieres: "dossier_views",
  solicitudes: "contact_requests",
  contactos: "club_contact_views",
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

  // Un error de conteo no puede tumbar el panel entero, pero tampoco
  // puede desaparecer: enseñar 0 en silencio le dice al club "no tienes
  // movimientos" justo cuando sí los tiene, que es peor que un error.
  // Se enseña 0 y se avisa para que quede constancia.
  if (error) {
    avisarDeFallo("metricas", `No se ha podido contar ${tabla} del club`, error);
    return 0;
  }
  return count ?? 0;
}

/** Lo mismo que `contar`, pero desde el principio de los tiempos. */
async function contarTodo(tabla: string, clubId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from(tabla)
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId);

  if (error) {
    avisarDeFallo("metricas", `No se ha podido contar el total de ${tabla} del club`, error);
    return 0;
  }
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

  const [resultados, visitasTotales] = await Promise.all([
    Promise.all(
      claves.flatMap((clave) => [
        contar(TABLAS[clave], clubId, inicioActual, ahora),
        contar(TABLAS[clave], clubId, inicioAnterior, inicioActual),
      ]),
    ),
    contarTodo(TABLAS.visitas, clubId),
  ]);

  const porClave = Object.fromEntries(
    claves.map((clave, indice) => [
      clave,
      { actual: resultados[indice * 2], anterior: resultados[indice * 2 + 1] },
    ]),
  ) as Record<keyof typeof TABLAS, MetricaClub>;

  return { dias, ...porClave, visitasTotales };
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
    metricas.solicitudes.actual === 0 &&
    metricas.contactos.actual === 0
  );
}

/** Lo que se puede decir de una ventana de tiempo concreta. */
export type VentanaDeVisitas = {
  /** Aperturas de la ficha. Una por persona y hora, no por recarga. */
  visitas: number;
  /** Cuántas veces se han abierto los datos de contacto. */
  contactos: number;
};

export type ResumenDeVisitas = {
  semana: VentanaDeVisitas;
  mes: VentanaDeVisitas;
  /** Desde que el club está en ApoyaClub. Sin el detalle de empresas. */
  totalVisitas: number;
  totalContactos: number;
};

type FilaEvento = { created_at: string };

/** Un tope por si algún día un club tiene muchísimo movimiento. */
const MAXIMO_FILAS = 5000;

function resumirVentana(filas: FilaEvento[], contactos: FilaEvento[], desde: string): VentanaDeVisitas {
  return {
    visitas: filas.filter((fila) => fila.created_at >= desde).length,
    contactos: contactos.filter((fila) => fila.created_at >= desde).length,
  };
}

/**
 * Quién ha entrado en la ficha del club, por semana y por mes
 * (migraciones 0014 y 0022).
 *
 * Las dos ventanas salen de la misma lectura de 30 días en vez de
 * hacer cuatro consultas: para el volumen de un club de barrio traer
 * las filas y contarlas aquí sale más barato que pedirle a la base
 * cuatro conteos.
 */
export async function obtenerResumenDeVisitas(
  clubId: string,
  ahora: Date = new Date(),
): Promise<ResumenDeVisitas> {
  const admin = createAdminClient();
  const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [visitas, contactos, totalVisitas, totalContactos] = await Promise.all([
    admin
      .from("club_page_views")
      .select("created_at")
      .eq("club_id", clubId)
      .gte("created_at", haceUnMes)
      .limit(MAXIMO_FILAS)
      .returns<FilaEvento[]>(),
    admin
      .from("club_contact_views")
      .select("created_at")
      .eq("club_id", clubId)
      .gte("created_at", haceUnMes)
      .limit(MAXIMO_FILAS)
      .returns<FilaEvento[]>(),
    contarTodo("club_page_views", clubId),
    contarTodo("club_contact_views", clubId),
  ]);

  if (visitas.error || contactos.error) {
    avisarDeFallo(
      "metricas",
      "No se ha podido leer el detalle de visitas del club",
      visitas.error ?? contactos.error,
    );
  }

  const filasVisitas = visitas.data ?? [];
  const filasContactos = contactos.data ?? [];

  return {
    semana: resumirVentana(filasVisitas, filasContactos, haceUnaSemana),
    mes: resumirVentana(filasVisitas, filasContactos, haceUnMes),
    totalVisitas,
    totalContactos,
  };
}
