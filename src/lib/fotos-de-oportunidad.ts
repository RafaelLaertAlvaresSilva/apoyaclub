/**
 * Las fotos de una oportunidad (migración 0052).
 *
 * Todo lo de aquí son funciones puras: ni base de datos ni almacén, y
 * por eso se pueden probar de verdad. Lo que se comprueba antes de
 * guardar es justo donde se cuelan los fallos que nadie ve — una foto
 * repetida al darle dos veces al botón, una cuarta que entra porque se
 * contó mal, una dirección que no es de nuestro almacén.
 */

/**
 * Tres.
 *
 * No es un número redondo por gusto. Para una lona basta una; para unas
 * equipaciones o un torneo vienen bien dos o tres. Más arriba, la
 * mayoría de los clubes sube una sola y el resto de huecos se queda
 * vacío, que se ve peor que no tener galería. Y es lo único de la web
 * cuyo coste crece con el uso: las ideas y las tareas son filas y no
 * pesan, las imágenes se pagan por giga.
 */
export const MAXIMO_FOTOS = 3;

/**
 * De dónde puede venir una foto.
 *
 * Solo del almacén de la propia aplicación. Sin esto, cualquiera que
 * mande el formulario a mano podría dejar escrita la dirección de una
 * imagen de otro servidor: el catálogo acabaría enseñando algo que no
 * controlamos y que puede cambiar o desaparecer cualquier día.
 */
export function esFotoDeLaCasa(url: string): boolean {
  if (!url) return false;
  try {
    const direccion = new URL(url);
    if (direccion.protocol !== "https:") return false;
    return direccion.pathname.includes("/storage/v1/object/public/club-media/");
  } catch {
    return false;
  }
}

export type ProblemaConLasFotos = "demasiadas" | "direccion-no-valida" | null;

/**
 * Qué impide guardar esta lista de fotos, o null si no hay nada.
 *
 * Devuelve un código y no un texto porque el texto cambia según dónde
 * se enseñe, y porque un código se comprueba en una prueba sin atarla a
 * cómo esté redactado el aviso.
 */
export function problemaConLasFotos(fotos: string[]): ProblemaConLasFotos {
  if (fotos.length > MAXIMO_FOTOS) return "demasiadas";
  if (fotos.some((foto) => !esFotoDeLaCasa(foto))) return "direccion-no-valida";
  return null;
}

/** El aviso que ve el club. */
export function mensajeDelProblema(problema: Exclude<ProblemaConLasFotos, null>): string {
  switch (problema) {
    case "demasiadas":
      return `Puedes poner ${MAXIMO_FOTOS} fotos como mucho en cada oportunidad.`;
    case "direccion-no-valida":
      return "Alguna foto no se ha subido bien. Quítala y vuelve a subirla.";
  }
}

/**
 * Las fotos tal y como llegan del formulario, dejadas en condiciones.
 *
 * Quita las vacías, las repetidas y las que no son de nuestro almacén, y
 * corta en el tope. Se hace así, saneando en vez de rechazar, porque
 * quien manda el formulario es el club y lo que quiere es guardar su
 * oportunidad: tirarle el formulario atrás por una foto repetida —que
 * sale sola de pulsar dos veces el botón— sería castigarle por un fallo
 * nuestro.
 *
 * El orden se respeta: la primera es la que sale de miniatura.
 */
export function fotosLimpias(valores: (string | null | undefined)[]): string[] {
  const vistas = new Set<string>();
  const limpias: string[] = [];

  for (const valor of valores) {
    const foto = (valor ?? "").trim();
    if (!foto || vistas.has(foto) || !esFotoDeLaCasa(foto)) continue;
    vistas.add(foto);
    limpias.push(foto);
    if (limpias.length === MAXIMO_FOTOS) break;
  }

  return limpias;
}

/** Si cabe alguna más. Lo usa el botón de subir para apagarse. */
export function cabenMas(fotos: string[]): boolean {
  return fotos.length < MAXIMO_FOTOS;
}

/**
 * La que sale de miniatura en el buscador y en la lista del club.
 *
 * Devuelve null y no una imagen de relleno a propósito: casi ninguna
 * oportunidad tendrá fotos el primer día, y un hueco gris repetido
 * veinte veces en el buscador se ve mucho peor que una lista de texto,
 * que es lo que hay hoy y funciona.
 */
export function fotoDePortada(fotos: string[] | null | undefined): string | null {
  return fotos?.find((foto) => esFotoDeLaCasa(foto)) ?? null;
}

/** Quitar una foto de la lista, por su dirección. */
export function sinLaFoto(fotos: string[], cual: string): string[] {
  return fotos.filter((foto) => foto !== cual);
}
