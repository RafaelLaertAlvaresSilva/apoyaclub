import { getTranslations } from "next-intl/server";
import { deporteDeLaLista, normalizarDeporte } from "@/lib/deportes";
import { enviarEmailNovedadesDeZona } from "@/lib/email/resend";
import { avisarDeFallo } from "@/lib/monitoring";
import { SITE_URL } from "@/lib/site";
import type { createAdminClient } from "@/lib/supabase/admin";

type ClienteAdmin = ReturnType<typeof createAdminClient>;

/**
 * Avisos de zona (migración 0061, pedido por Rafael el 7-11-2026).
 *
 * Una empresa busca en su provincia y no sale nada. En vez de irse sin
 * dejar rastro, deja su correo y le escribimos cuando aparece algo
 * nuevo allí. Sin cuenta, como mucho un correo por semana, y con baja
 * en un clic desde el propio correo.
 */

/** Días mínimos entre dos correos al mismo aviso. */
export const DIAS_ENTRE_CORREOS = 7;
/** Cuántas oportunidades caben en un correo. */
export const MAXIMO_EN_EL_CORREO = 5;

export type PaisDeAviso = "ES" | "PT" | "BR";

export type AvisoDeZona = {
  id: string;
  email: string;
  country: PaisDeAviso;
  province: string | null;
  sport: string | null;
  locale: string;
  unsubscribe_token: string;
  created_at: string;
  last_sent_at: string | null;
};

export type OportunidadNueva = {
  id: string;
  titulo: string;
  clubId: string;
  clubNombre: string;
  clubSlug: string;
  clubProvincia: string | null;
  /** Sin país (vista sin la migración 0060) cuenta como España. */
  clubPais: string | null;
  creadaEl: string;
};

/** El país de un aviso: el elegido en el buscador; "todos" o nada, el del idioma. */
export function paisDelAviso(pais: string | null | undefined, locale: string): PaisDeAviso {
  if (pais === "ES" || pais === "PT" || pais === "BR") return pais;
  if (locale === "br") return "BR";
  if (locale === "pt") return "PT";
  return "ES";
}

/** "Alicante · fútbol", "Alicante", "fútbol en España" o "España". */
export function textoDeLaZona(
  aviso: { province: string | null; sport: string | null },
  nombreDelPais: string,
  nombreDelDeporte: (deporte: string) => string,
): string {
  const deporte = aviso.sport ? nombreDelDeporte(aviso.sport) : null;
  if (aviso.province) return deporte ? `${aviso.province} · ${deporte}` : aviso.province;
  return deporte ? `${deporte} · ${nombreDelPais}` : nombreDelPais;
}

/** Si toca escribirle hoy: nunca escrito, o hace al menos una semana. */
export function tocaEscribir(aviso: Pick<AvisoDeZona, "last_sent_at">, ahora: Date): boolean {
  if (!aviso.last_sent_at) return true;
  const dias = (ahora.getTime() - new Date(aviso.last_sent_at).getTime()) / 86_400_000;
  return dias >= DIAS_ENTRE_CORREOS;
}

/**
 * Lo que le interesa a un aviso de todo lo publicado: de su país, de su
 * provincia (si la puso), de un club con equipo de su deporte (si lo
 * puso) y publicado DESPUÉS de lo último que se le contó. Lo de antes
 * de apuntarse no es nuevo: ya lo vio en el buscador.
 */
export function loNuevoParaElAviso(
  aviso: AvisoDeZona,
  oportunidades: OportunidadNueva[],
  deportesPorClub: Map<string, Set<string>>,
): OportunidadNueva[] {
  const desde = new Date(aviso.last_sent_at ?? aviso.created_at).getTime();
  const deporte = aviso.sport ? (deporteDeLaLista(aviso.sport)?.clave ?? normalizarDeporte(aviso.sport)) : null;
  return oportunidades
    .filter((una) => new Date(una.creadaEl).getTime() > desde)
    .filter((una) => (una.clubPais ?? "ES") === aviso.country)
    .filter((una) => !aviso.province || una.clubProvincia === aviso.province)
    .filter((una) => !deporte || (deportesPorClub.get(una.clubId)?.has(deporte) ?? false))
    .sort((a, b) => b.creadaEl.localeCompare(a.creadaEl));
}

/** El enlace del buscador con lo que estaba buscando. */
export function buscarUrlDelAviso(aviso: Pick<AvisoDeZona, "locale" | "country" | "province" | "sport">): string {
  const params = new URLSearchParams({ pais: aviso.country });
  if (aviso.province) params.set("provincia", aviso.province);
  if (aviso.sport) params.set("deporte", aviso.sport);
  return `${SITE_URL}/${aviso.locale}/buscar?${params.toString()}`;
}

type FilaVista = {
  opportunity_id: string;
  title: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  club_province: string | null;
  club_country?: string | null;
  opportunity_created_at: string;
};

/**
 * La tarea diaria: un correo a cada aviso que tenga algo nuevo y al que
 * no se le haya escrito en la última semana. Devuelve cuántos salen.
 */
export async function avisarDeZonas(admin: ClienteAdmin, ahora = new Date()): Promise<number> {
  const { data: avisos, error } = await admin
    .from("zone_alerts")
    .select("*")
    .eq("active", true)
    .returns<AvisoDeZona[]>();

  // Sin la migración 0061 la tabla no existe: no se avisa a nadie y ya.
  if (error) {
    if (!/zone_alerts/.test(error.message ?? "")) {
      avisarDeFallo("empresa", "No se han podido leer los avisos de zona", error);
    }
    return 0;
  }

  const pendientes = (avisos ?? []).filter((aviso) => tocaEscribir(aviso, ahora));
  if (pendientes.length === 0) return 0;

  const masAntiguo = pendientes
    .map((aviso) => aviso.last_sent_at ?? aviso.created_at)
    .sort()[0];

  const [{ data: filas }, { data: equipos }] = await Promise.all([
    admin.from("opportunity_search_view").select("*").gt("opportunity_created_at", masAntiguo).returns<FilaVista[]>(),
    admin.from("club_teams").select("club_id, sport").returns<{ club_id: string; sport: string | null }[]>(),
  ]);

  const oportunidades: OportunidadNueva[] = (filas ?? []).map((fila) => ({
    id: fila.opportunity_id,
    titulo: fila.title,
    clubId: fila.club_id,
    clubNombre: fila.club_name,
    clubSlug: fila.club_slug,
    clubProvincia: fila.club_province,
    clubPais: fila.club_country ?? null,
    creadaEl: fila.opportunity_created_at,
  }));
  if (oportunidades.length === 0) return 0;

  const deportesPorClub = new Map<string, Set<string>>();
  for (const equipo of equipos ?? []) {
    if (!equipo.sport) continue;
    const clave = deporteDeLaLista(equipo.sport)?.clave ?? normalizarDeporte(equipo.sport);
    const suyos = deportesPorClub.get(equipo.club_id) ?? new Set<string>();
    suyos.add(clave);
    deportesPorClub.set(equipo.club_id, suyos);
  }

  let enviados = 0;
  for (const aviso of pendientes) {
    const nuevas = loNuevoParaElAviso(aviso, oportunidades, deportesPorClub);
    if (nuevas.length === 0) continue;

    const tBuscar = await getTranslations({ locale: aviso.locale, namespace: "buscar.filtros" });
    const tEtiquetas = await getTranslations({ locale: aviso.locale, namespace: "common.etiquetas" });
    const zona = textoDeLaZona(aviso, tBuscar(`paises.${aviso.country}` as never), (deporte) => {
      const clave = deporteDeLaLista(deporte)?.clave;
      return clave ? tEtiquetas(`deporte.${clave}` as never).toLowerCase() : deporte;
    });
    const enElCorreo = nuevas.slice(0, MAXIMO_EN_EL_CORREO);

    const resultado = await enviarEmailNovedadesDeZona({
      email: aviso.email,
      zona,
      idioma: aviso.locale,
      oportunidades: enElCorreo.map((una) => ({
        titulo: una.titulo,
        clubNombre: una.clubNombre,
        url: `${SITE_URL}/${aviso.locale}/club/${una.clubSlug}/oportunidad/${una.id}`,
      })),
      cuantasMas: nuevas.length - enElCorreo.length,
      buscarUrl: buscarUrlDelAviso(aviso),
      bajaUrl: `${SITE_URL}/${aviso.locale}/avisos/baja?t=${aviso.unsubscribe_token}`,
    });
    if (!resultado.ok) continue;

    const { error: errorFecha } = await admin
      .from("zone_alerts")
      .update({ last_sent_at: ahora.toISOString() })
      .eq("id", aviso.id);
    if (errorFecha) avisarDeFallo("empresa", "No se ha podido apuntar el aviso de zona enviado", errorFecha);
    enviados += 1;
  }
  return enviados;
}
