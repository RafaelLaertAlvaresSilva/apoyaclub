/**
 * Los papeles de cada patrocinio (migración 0051).
 *
 * Todo lo de aquí son funciones puras: ni base de datos ni almacén, y
 * por eso se pueden probar de verdad. Lo que se comprueba antes de
 * subir un archivo es justo donde se cuelan los fallos que nadie ve —
 * un nombre con una barra dentro que se sale de la carpeta, un tipo
 * que el navegador declara mal, un séptimo archivo que entra porque se
 * contó mal el límite.
 */

export type TipoDeDocumento = "contrato" | "factura" | "otro";

export const TIPOS_DE_DOCUMENTO: { id: TipoDeDocumento; etiqueta: string }[] = [
  { id: "contrato", etiqueta: "Contrato" },
  { id: "factura", etiqueta: "Factura" },
  { id: "otro", etiqueta: "Otro documento" },
];

export function esTipoValido(valor: string): valor is TipoDeDocumento {
  return TIPOS_DE_DOCUMENTO.some((tipo) => tipo.id === valor);
}

/** Lo mismo que acepta el bucket. Si cambia uno, cambia el otro. */
export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/**
 * Seis por patrocinador.
 *
 * No es un número redondo por gusto: un patrocinio normal tiene un
 * contrato y una o dos facturas. Seis deja sitio para una renovación y
 * algún anexo sin que esto se convierta en el disco duro del club, que
 * es justo lo que no queremos que sea.
 */
export const MAXIMO_POR_PATROCINADOR = 6;

/**
 * PDF e imágenes.
 *
 * Las imágenes entran porque media España firma el patrocinio en papel
 * y lo guarda como la foto que le hizo con el móvil. Sin ellas, esos
 * clubes no podrían subir nada.
 */
export const TIPOS_MIME_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const EXTENSION_DEL_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * La extensión se saca del tipo declarado, NO del nombre del archivo.
 *
 * El nombre lo escribe quien sube: "contrato.pdf.exe", "../../otro.pdf"
 * o un nombre con una barra dentro que se saldría de la carpeta del
 * club. Como el tipo ya está comprobado contra la lista de arriba,
 * derivar la extensión de él deja el nombre de dentro del almacén
 * siempre limpio.
 */
export function extensionDe(tipoMime: string): string {
  return EXTENSION_DEL_MIME[tipoMime] ?? "bin";
}

/**
 * Dónde se guarda: `<club>/<patrocinador>/<uuid>.<ext>`.
 *
 * El club primero porque es lo que miran las políticas del almacén
 * (`foldername(name)[1] = auth.uid()`): con el patrocinador delante,
 * cualquiera podría escribir en la carpeta de otro.
 */
export function rutaDelDocumento(
  clubId: string,
  patrocinadorId: string,
  tipoMime: string,
  identificador: string,
): string {
  return `${clubId}/${patrocinadorId}/${identificador}.${extensionDe(tipoMime)}`;
}

/** El nombre del archivo, recortado y sin rutas dentro. */
export function nombreLimpio(nombre: string): string {
  const sinRuta = nombre.split(/[\\/]/).pop() ?? "";
  const limpio = sinRuta.replace(/[\u0000-\u001f]/g, "").trim();
  return limpio.slice(0, 120) || "documento";
}

export type ProblemaAlSubir =
  | "sin-archivo"
  | "tipo-no-permitido"
  | "demasiado-grande"
  | "vacio"
  | "limite-alcanzado"
  | null;

/**
 * Qué impide subir este archivo, o null si no hay nada que lo impida.
 *
 * Devuelve un código y no un texto porque el texto cambia según dónde
 * se enseñe, y porque un código se comprueba en una prueba sin atarla
 * a cómo esté redactado el aviso.
 */
export function problemaAlSubir({
  tipoMime,
  tamano,
  yaGuardados,
}: {
  tipoMime: string | undefined;
  tamano: number | undefined;
  yaGuardados: number;
}): ProblemaAlSubir {
  if (!tipoMime || tamano === undefined) return "sin-archivo";
  if (yaGuardados >= MAXIMO_POR_PATROCINADOR) return "limite-alcanzado";
  if (!TIPOS_MIME_PERMITIDOS.includes(tipoMime as (typeof TIPOS_MIME_PERMITIDOS)[number])) {
    return "tipo-no-permitido";
  }
  if (tamano <= 0) return "vacio";
  if (tamano > TAMANO_MAXIMO_BYTES) return "demasiado-grande";
  return null;
}

/** El aviso que ve el club. */
export function mensajeDelProblema(problema: Exclude<ProblemaAlSubir, null>): string {
  switch (problema) {
    case "sin-archivo":
      return "Elige un archivo antes de guardar.";
    case "tipo-no-permitido":
      return "Solo se pueden subir PDF o fotos (JPG, PNG o WEBP).";
    case "demasiado-grande":
      return `El archivo pesa más de ${Math.round(TAMANO_MAXIMO_BYTES / (1024 * 1024))} MB. Comprímelo o haz la foto con menos calidad.`;
    case "vacio":
      return "El archivo está vacío.";
    case "limite-alcanzado":
      return `Cada patrocinador admite ${MAXIMO_POR_PATROCINADOR} documentos. Borra alguno para subir otro.`;
  }
}

/** "820 KB", "2,4 MB". */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export type DocumentoDePatrocinio = {
  id: string;
  patrocinadorId: string;
  tipo: TipoDeDocumento;
  rutaEnElAlmacen: string;
  nombreDelArchivo: string;
  tipoMime: string;
  tamano: number;
  subidoEl: string;
};

export type FilaDocumento = {
  id: string;
  sponsor_id: string;
  kind: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export function filaADocumento(fila: FilaDocumento): DocumentoDePatrocinio {
  return {
    id: fila.id,
    patrocinadorId: fila.sponsor_id,
    tipo: esTipoValido(fila.kind) ? fila.kind : "otro",
    rutaEnElAlmacen: fila.storage_path,
    nombreDelArchivo: fila.file_name,
    tipoMime: fila.mime_type,
    tamano: fila.size_bytes,
    subidoEl: fila.created_at,
  };
}

/**
 * Los documentos agrupados por patrocinador.
 *
 * La pantalla de patrocinadores pinta una lista de empresas y cada una
 * necesita los suyos. Pedirlos de uno en uno sería una consulta por
 * empresa; se piden todos de una y se reparten aquí.
 */
export function agruparPorPatrocinador(
  documentos: DocumentoDePatrocinio[],
): Map<string, DocumentoDePatrocinio[]> {
  const mapa = new Map<string, DocumentoDePatrocinio[]>();
  for (const documento of documentos) {
    const lista = mapa.get(documento.patrocinadorId);
    if (lista) lista.push(documento);
    else mapa.set(documento.patrocinadorId, [documento]);
  }
  return mapa;
}
