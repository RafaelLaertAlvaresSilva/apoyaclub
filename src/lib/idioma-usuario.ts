import { routing, type AppLocale } from "@/i18n/routing";

/**
 * El idioma en el que escribirle a alguien por correo.
 *
 * Se guarda en los datos de su cuenta (`user_metadata.idioma`) al
 * registrarse y cada vez que inicia sesión, con el idioma de la página
 * desde la que lo hizo. No hace falta ninguna columna nueva en la base
 * de datos: los avisos ya leen la cuenta de cada destinatario para
 * saber su correo, y el idioma viene en el mismo sitio.
 *
 * Quien se registró antes de que existiera esto no lo tiene guardado y
 * recibe los correos en español, que es como los ha recibido siempre.
 */
export function idiomaDe(
  usuario: { user_metadata?: Record<string, unknown> | null } | null | undefined,
): AppLocale {
  const guardado = usuario?.user_metadata?.idioma;
  return esIdioma(guardado) ? guardado : routing.defaultLocale;
}

export function esIdioma(valor: unknown): valor is AppLocale {
  return typeof valor === "string" && (routing.locales as readonly string[]).includes(valor);
}
