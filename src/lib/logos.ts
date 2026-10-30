/**
 * El logo de ApoyaClub en cada idioma.
 *
 * El eslogan va dentro de la imagen ("CONECTA · IMPULSA · CRECE"), así
 * que cada idioma tiene su propio archivo: en inglés "CONNECT · EMPOWER
 * · GROW", en portugués "CONECTA · IMPULSIONA · CRESCE".
 *
 * Cada uno en dos versiones, igual que el español: `claro` para fondo
 * blanco y `oscuro`, con su resplandor, para la barra del panel en modo
 * oscuro. Todas miden 950 × 210 y llevan el fondo transparente, para que
 * cambiar de idioma o de modo no mueva la barra.
 */
const LOGOS: Record<string, { claro: string; oscuro: string }> = {
  es: { claro: "/logo-full-claro.webp", oscuro: "/logo-full-oscuro.webp" },
  en: { claro: "/logo-full-claro-en.webp", oscuro: "/logo-full-oscuro-en.webp" },
  pt: { claro: "/logo-full-claro-pt.webp", oscuro: "/logo-full-oscuro-pt.webp" },
  // El eslogan en portugués ("Conecta · Impulsiona · Cresce") vale igual en Brasil.
  br: { claro: "/logo-full-claro-pt.webp", oscuro: "/logo-full-oscuro-pt.webp" },
};

export function logosDelIdioma(locale: string): { claro: string; oscuro: string } {
  return LOGOS[locale] ?? LOGOS.es;
}
