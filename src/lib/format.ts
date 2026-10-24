import type { AppLocale } from "@/i18n/routing";
import { LOCALE_CONFIG } from "@/config/locales";

/**
 * Fase 14: formato de moneda, fecha y número según el idioma actual, en
 * vez de instancias de `Intl.NumberFormat("es-ES")` /
 * `Intl.DateTimeFormat("es-ES")` sueltas por el código. Reciben siempre
 * el `locale` explícito (el que da `useLocale()` en componentes, o el
 * `params.locale` de la página/Server Action) para que funcionen igual
 * en cliente y servidor.
 */

export function formatearMoneda(valor: number, locale: AppLocale): string {
  const { intlLocale, currency } = LOCALE_CONFIG[locale];
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: valor % 1 === 0 ? 0 : 2,
  }).format(valor);
}

export function formatearNumero(valor: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale).format(valor);
}

export function formatearFecha(
  fecha: string | Date,
  locale: AppLocale,
  opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  const { intlLocale, timeZone } = LOCALE_CONFIG[locale];
  return new Intl.DateTimeFormat(intlLocale, { ...opciones, timeZone }).format(
    typeof fecha === "string" ? new Date(fecha) : fecha,
  );
}

/**
 * El precio de una oportunidad en el idioma de quien la mira: "200,00 €"
 * en español y portugués, "€200.00" en inglés. Mismas reglas que
 * `formatoValorOportunidad` (que se queda para el panel, los PDF y el
 * dossier, que de momento solo están en español).
 */
export function formatoDeValor(locale: AppLocale): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale, {
    style: "currency",
    currency: LOCALE_CONFIG[locale].currency.code,
    maximumFractionDigits: 2,
  });
}

/**
 * Lo que se enseña en el sitio del precio de una oportunidad.
 *
 * Una necesidad (el club pide un servicio, no vende nada) no tiene
 * precio: lo que recibe la empresa es visibilidad. Antes salía "0,00 €",
 * que se leía como un error o como "esto no vale nada". Una oferta sin
 * precio puesto tampoco enseña "0,00 €": el precio se habla.
 */
export function textoDelPrecio(
  oportunidad: { value: number; esNecesidad?: boolean },
  formato: Intl.NumberFormat,
  textos: { necesidad: string; aConvenir: string },
): string {
  if (oportunidad.esNecesidad) return textos.necesidad;
  return oportunidad.value > 0 ? formato.format(oportunidad.value) : textos.aConvenir;
}

/** Si al lado del precio cabe "por empresa": solo cuando hay una cifra. */
export function tienePrecio(oportunidad: { value: number; esNecesidad?: boolean }): boolean {
  return !oportunidad.esNecesidad && oportunidad.value > 0;
}

/**
 * La oportunidad más barata con precio de verdad, para el "desde ..." de
 * la portada del dossier. Las necesidades y las que no tienen precio no
 * cuentan: si no, un dossier con una necesidad diría "desde 0,00 €".
 */
export function precioMasBajo(oportunidades: { value: number; esNecesidad?: boolean }[]): number | null {
  const conPrecio = oportunidades.filter(tienePrecio).map((oportunidad) => oportunidad.value);
  return conPrecio.length > 0 ? Math.min(...conPrecio) : null;
}
