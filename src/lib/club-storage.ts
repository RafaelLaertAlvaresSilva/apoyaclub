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
  // "logo-empresa" es del directorio (migración 0033). Cabe aquí
  // porque la política de Storage solo mira que la carpeta raíz sea el
  // uid de quien sube, y eso vale igual para un club que para una empresa.
  carpeta: "logo" | "fotos" | "patrocinadores" | "logo-empresa",
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
    // El motivo real importa: casi siempre es el bucket "club-media" sin
    // crear o una política de Storage que no deja escribir, y sin el
    // mensaje no hay forma de distinguir uno de otro.
    console.error("[storage] No se ha podido subir la imagen:", error);

    // Mismo caso que en las acciones del panel: si el almacén rechaza la
    // escritura, casi siempre es que el testigo de sesión del navegador
    // es más viejo que los permisos de la cuenta.
    const mensaje = error.message ?? "";
    if (mensaje.includes("row-level security") || mensaje.toLowerCase().includes("unauthorized")) {
      throw new Error(
        "Tu sesión no tiene permiso para subir imágenes. Cierra sesión, vuelve a entrar e inténtalo otra vez.",
      );
    }

    throw new Error(`No se ha podido subir la imagen: ${mensaje}`);
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
