import { routing } from "@/i18n/routing";

/**
 * ¿La redirección de una dirección sin idioma ("/buscar", "/") a su
 * versión con idioma debe ser permanente?
 *
 * next-intl redirige "/buscar" → "/es/buscar" con un 307 (temporal),
 * porque el idioma de destino depende de quién visita. Para Google eso
 * significa "la dirección de verdad sigue siendo /buscar": en noviembre
 * de 2026 Search Console marcó /es, /es/buscar, /es/para-clubes,
 * /es/cookies y /es/aviso-legal como "Duplicada: Google ha elegido una
 * versión canónica diferente", con la dirección corta como la buena.
 * Esas direcciones cortas fueron las de verdad antes de poner el idioma
 * siempre delante, y siguen enlazadas desde fuera.
 *
 * Cuando el destino es el español (el idioma por defecto, y el que
 * recibe Google, que no manda idioma), la redirección pasa a 308
 * (permanente) y Google traslada la dirección a /es/… Si el destino es
 * otro idioma (un visitante con el navegador en portugués o inglés), se
 * queda en 307: para esa persona es una preferencia suya, no un cambio
 * de dirección, y un navegador recuerda los 308 para siempre.
 */
export function debeSerPermanente(pathnameDeLaPeticion: string, destino: string | null, metodo: string): boolean {
  if (!destino) return false;
  if (metodo !== "GET" && metodo !== "HEAD") return false;
  // Solo las direcciones que llegan sin idioma delante.
  const conIdioma = new RegExp(`^/(${routing.locales.join("|")})(/|$)`);
  if (conIdioma.test(pathnameDeLaPeticion)) return false;
  let rutaDestino: string;
  try {
    rutaDestino = new URL(destino, "https://apoyaclub.com").pathname;
  } catch {
    return false;
  }
  return new RegExp(`^/${routing.defaultLocale}(/|$)`).test(rutaDestino);
}
