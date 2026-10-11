import type { SupabaseClient } from "@supabase/supabase-js";
import {
  agruparPorPatrocinador,
  filaADocumento,
  type DocumentoDePatrocinio,
  type FilaDocumento,
} from "@/lib/documentos-patrocinio";

/**
 * El almacén de los papeles del patrocinio (migración 0051).
 *
 * PRIVADO, al contrario que `club-media`. No tiene dirección pública:
 * para leer un archivo hay que pedir un enlace firmado al servidor.
 */
export const BUCKET_DOCUMENTOS = "club-docs";

/** Cuánto dura el enlace de descarga. Lo justo para que el navegador lo
 * abra; pasado ese rato, el enlace copiado ya no sirve. */
export const SEGUNDOS_DEL_ENLACE = 60;

/**
 * Todos los documentos del club, repartidos por patrocinador.
 *
 * Una sola consulta para toda la pantalla: la lista de patrocinadores
 * pinta una empresa detrás de otra y pedir los papeles de cada una por
 * separado serían diez consultas para diez empresas.
 *
 * Envuelto en try/catch y devolviendo un mapa vacío a propósito: la
 * tabla llega con la migración 0051 y, hasta que un club la aplique,
 * no existe. Sin esto, la pantalla entera de patrocinadores —que
 * funcionaba perfectamente antes de esta función— se caería por una
 * tabla que todavía no está.
 */
export async function documentosDelClub(
  supabase: SupabaseClient,
  clubId: string,
): Promise<Map<string, DocumentoDePatrocinio[]>> {
  try {
    const { data, error } = await supabase
      .from("club_sponsor_documents")
      .select("id, sponsor_id, kind, storage_path, file_name, mime_type, size_bytes, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: true })
      .returns<FilaDocumento[]>();

    if (error || !data) return new Map();
    return agruparPorPatrocinador(data.map(filaADocumento));
  } catch {
    return new Map();
  }
}

/** Cuántos papeles tiene ya un patrocinador, para el tope de seis. */
export async function contarDocumentosDelPatrocinador(
  supabase: SupabaseClient,
  clubId: string,
  patrocinadorId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("club_sponsor_documents")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("sponsor_id", patrocinadorId);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Las rutas de los archivos de un patrocinador.
 *
 * Hace falta al borrar un patrocinador: la base de datos se lleva las
 * filas por sí sola (`on delete cascade`), pero NO los archivos. El
 * almacén no sabe nada de claves ajenas, así que los archivos hay que
 * barrerlos antes a mano o se quedan ocupando sitio para siempre.
 */
export async function rutasDeLosDocumentos(
  supabase: SupabaseClient,
  clubId: string,
  patrocinadorId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("club_sponsor_documents")
      .select("storage_path")
      .eq("club_id", clubId)
      .eq("sponsor_id", patrocinadorId)
      .returns<{ storage_path: string }[]>();

    if (error || !data) return [];
    return data.map((fila) => fila.storage_path);
  } catch {
    return [];
  }
}

/** Todas las rutas del club, para la baja de la cuenta. */
export async function todasLasRutasDelClub(
  supabase: SupabaseClient,
  clubId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("club_sponsor_documents")
      .select("storage_path")
      .eq("club_id", clubId)
      .returns<{ storage_path: string }[]>();

    if (error || !data) return [];
    return data.map((fila) => fila.storage_path);
  } catch {
    return [];
  }
}
