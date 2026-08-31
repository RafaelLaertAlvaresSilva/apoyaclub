import type { SupabaseClient } from "@supabase/supabase-js";
import { comprimirImagen } from "@/lib/image-compression";

export const BUCKET_MEDIA_CLUB = "club-media";

/**
 * Comprime y sube una imagen del club (logo o foto) a Storage, dentro de
 * la carpeta del propio usuario (las políticas de RLS del bucket solo
 * permiten escribir ahí). Devuelve la URL pública para guardarla en la
 * fila de `clubs`.
 */
export async function subirImagenClub(
  supabase: SupabaseClient,
  userId: string,
  carpeta: "logo" | "fotos" | "patrocinadores",
  archivo: File,
): Promise<string> {
  const blob = await comprimirImagen(archivo);
  const nombreArchivo = `${crypto.randomUUID()}.jpg`;
  const ruta = `${userId}/${carpeta}/${nombreArchivo}`;

  const { error } = await supabase.storage.from(BUCKET_MEDIA_CLUB).upload(ruta, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error("No se ha podido subir la imagen. Inténtalo de nuevo.");
  }

  const { data } = supabase.storage.from(BUCKET_MEDIA_CLUB).getPublicUrl(ruta);
  return data.publicUrl;
}

/** Borra una imagen del club a partir de su URL pública. */
export async function eliminarImagenClub(
  supabase: SupabaseClient,
  urlPublica: string,
): Promise<void> {
  const marcador = `/object/public/${BUCKET_MEDIA_CLUB}/`;
  const indice = urlPublica.indexOf(marcador);
  if (indice === -1) return;

  const ruta = urlPublica.slice(indice + marcador.length);
  await supabase.storage.from(BUCKET_MEDIA_CLUB).remove([ruta]);
}
