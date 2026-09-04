/**
 * Descarga de imágenes para meterlas dentro de un documento.
 *
 * El dossier en Word no puede enlazar las fotos: si lo hiciera, el club
 * abriría el archivo en otro ordenador y vería huecos. Hay que empotrar
 * los bytes, así que hay que traérselos.
 *
 * También hace falta saber el tamaño real de cada imagen. Word no
 * conserva la proporción por su cuenta: si se le da un ancho y un alto
 * a ojo, el escudo del club sale aplastado. Se leen de la cabecera del
 * archivo, que para PNG, JPEG y GIF está en los primeros bytes y no
 * hace falta decodificar nada.
 */

export type ImagenDescargada = {
  data: Buffer;
  /** Formato tal y como lo espera `ImageRun` de la librería `docx`. */
  tipo: "png" | "jpg" | "gif";
  ancho: number;
  alto: number;
};

/** 8 MB. Una foto de portada razonable no llega; una barbaridad, sí. */
const TAMANO_MAXIMO = 8 * 1024 * 1024;
const ESPERA_MAXIMA_MS = 8000;

function medirPng(bytes: Buffer): { ancho: number; alto: number } | null {
  // 8 bytes de firma + 4 de longitud + "IHDR" y ya vienen ancho y alto.
  if (bytes.length < 24) return null;
  if (bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
}

function medirGif(bytes: Buffer): { ancho: number; alto: number } | null {
  if (bytes.length < 10) return null;
  return { ancho: bytes.readUInt16LE(6), alto: bytes.readUInt16LE(8) };
}

function medirJpeg(bytes: Buffer): { ancho: number; alto: number } | null {
  // Un JPEG es una cadena de segmentos. El tamaño está en el marcador
  // "start of frame" (SOF), que hay que ir a buscar saltando el resto.
  let posicion = 2;

  while (posicion + 9 < bytes.length) {
    if (bytes[posicion] !== 0xff) {
      posicion += 1;
      continue;
    }

    const marcador = bytes[posicion + 1];
    const esSof =
      (marcador >= 0xc0 && marcador <= 0xc3) ||
      (marcador >= 0xc5 && marcador <= 0xc7) ||
      (marcador >= 0xc9 && marcador <= 0xcb) ||
      (marcador >= 0xcd && marcador <= 0xcf);

    if (esSof) {
      return { alto: bytes.readUInt16BE(posicion + 5), ancho: bytes.readUInt16BE(posicion + 7) };
    }

    // Marcadores sin carga útil: se pasan de largo.
    if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
      posicion += 2;
      continue;
    }

    const longitud = bytes.readUInt16BE(posicion + 2);
    if (longitud < 2) return null;
    posicion += 2 + longitud;
  }

  return null;
}

function reconocer(bytes: Buffer): ImagenDescargada | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0x89 && bytes.toString("ascii", 1, 4) === "PNG") {
    const medidas = medirPng(bytes);
    return medidas ? { data: bytes, tipo: "png", ...medidas } : null;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const medidas = medirJpeg(bytes);
    return medidas ? { data: bytes, tipo: "jpg", ...medidas } : null;
  }

  if (bytes.toString("ascii", 0, 3) === "GIF") {
    const medidas = medirGif(bytes);
    return medidas ? { data: bytes, tipo: "gif", ...medidas } : null;
  }

  // WebP, SVG, AVIF y compañía: Word no los admite empotrados sin más.
  // Se devuelve null y el documento sale sin esa imagen, que es mejor
  // que un archivo que Word se niega a abrir.
  return null;
}

/**
 * Trae una imagen por su URL. Devuelve null ante cualquier problema —
 * una foto que no carga nunca puede impedir que el club se descargue su
 * dossier.
 */
export async function descargarImagen(url: string | null | undefined): Promise<ImagenDescargada | null> {
  if (!url) return null;

  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MAXIMA_MS) });
    if (!respuesta.ok) return null;

    const declarado = Number(respuesta.headers.get("content-length") ?? 0);
    if (declarado > TAMANO_MAXIMO) return null;

    const bytes = Buffer.from(await respuesta.arrayBuffer());
    if (bytes.length > TAMANO_MAXIMO) return null;

    return reconocer(bytes);
  } catch {
    return null;
  }
}

/**
 * Alto que le corresponde a una imagen para un ancho dado, respetando su
 * proporción. Es lo que evita que el escudo salga estirado.
 */
export function altoProporcional(imagen: ImagenDescargada, ancho: number): number {
  if (imagen.ancho <= 0) return ancho;
  return Math.round((imagen.alto / imagen.ancho) * ancho);
}

/** Ancho y alto que caben en una caja sin recortar ni deformar nada. */
export function encajarEn(
  imagen: ImagenDescargada,
  anchoMaximo: number,
  altoMaximo: number,
): { ancho: number; alto: number } {
  if (imagen.ancho <= 0 || imagen.alto <= 0) return { ancho: anchoMaximo, alto: altoMaximo };

  const escala = Math.min(anchoMaximo / imagen.ancho, altoMaximo / imagen.alto);
  return {
    ancho: Math.max(1, Math.round(imagen.ancho * escala)),
    alto: Math.max(1, Math.round(imagen.alto * escala)),
  };
}
