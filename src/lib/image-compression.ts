/**
 * Compresión de imágenes en el navegador antes de subirlas a Supabase
 * Storage. No usamos ninguna librería externa: basta con un <canvas> para
 * reescalar la imagen y volver a codificarla con calidad reducida.
 *
 * Solo se puede usar en el navegador (usa `Image` y `document`).
 */

export const TAMANO_MAXIMO_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15 MB
const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.8;

export class ErrorImagenInvalida extends Error {}

/**
 * Reescala (si hace falta) y recomprime una imagen. Devuelve un Blob en
 * JPEG, normalmente muy por debajo del límite del bucket (5 MB).
 */
export async function comprimirImagen(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith("image/")) {
    throw new ErrorImagenInvalida("El archivo no es una imagen.");
  }
  if (archivo.size > TAMANO_MAXIMO_ORIGINAL_BYTES) {
    throw new ErrorImagenInvalida("La imagen pesa demasiado (máximo 15 MB).");
  }

  const bitmap = await cargarBitmap(archivo);

  const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    throw new ErrorImagenInvalida("Tu navegador no permite procesar imágenes.");
  }
  contexto.drawImage(bitmap, 0, 0, ancho, alto);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG),
  );

  if (!blob) {
    throw new ErrorImagenInvalida("No se ha podido procesar la imagen.");
  }

  return blob;
}

async function cargarBitmap(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(archivo);
    } catch {
      // Algunos navegadores no soportan createImageBitmap para todos los
      // formatos (p.ej. HEIC); caemos al método con <img> de abajo.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ErrorImagenInvalida("No se ha podido leer la imagen."));
    };
    img.src = url;
  });
}
