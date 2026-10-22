/**
 * Las cajas de "Tu mes en ApoyaClub" y de "Quién ha entrado en tu ficha".
 *
 * Antes eran un borde gris finito con el título en gris pequeño, y las
 * siete se confundían con el fondo de la tarjeta: costaba ver dónde
 * acababa una y empezaba la otra. Ahora cada caja lleva el borde y la
 * sombra del color de su apartado, y el título va en una franja de ese
 * color, como la cabecera de una tabla.
 */
export const CAJA_METRICA =
  "overflow-hidden rounded-lg border border-(--tono-borde) bg-white shadow-sm";

export const TITULO_METRICA =
  "border-b border-(--tono-borde) bg-(--tono-fondo) px-3 py-2 text-xs font-bold uppercase tracking-wide text-(--tono-tinta)";

export const CUERPO_METRICA = "px-3 pb-3 pt-2";
