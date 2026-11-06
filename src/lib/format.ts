import type { AppLocale } from "@/i18n/routing";
import { LOCALE_CONFIG } from "@/config/locales";
import { monedaDelPais } from "@/lib/planes";

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
 * El precio de una oportunidad en el idioma de quien la mira ("200,00 €"
 * en español, "€200.00" en inglés) y en la moneda del club que la
 * publica. Mismas reglas que
 * `formatoValorOportunidad` (que se queda para el panel, los PDF y el
 * dossier, que de momento solo están en español).
 */
export function formatoDeValor(locale: AppLocale, paisDelClub?: string | null): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale, {
    style: "currency",
    currency: monedaDeLosPrecios(paisDelClub),
    // "R$" también en español o inglés (si no, sale "200,00 BRL").
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  });
}

/**
 * La moneda de los precios de un club: la de SU país, no la del idioma
 * en que se lee la web (pedido por Rafael el 6-11-2026). Un club de
 * Brasil pone sus precios en reales y se ven en reales también en /es;
 * uno de España, en euros también en /br. Sin país (una ficha de antes
 * de la migración 0060), euros.
 */
export function monedaDeLosPrecios(paisDelClub: string | null | undefined): "EUR" | "BRL" {
  return monedaDelPais(paisDelClub);
}

/** El símbolo de esa moneda, para etiquetas como "Valor (R$)". */
export function simboloDeMoneda(paisDelClub: string | null | undefined): string {
  return monedaDeLosPrecios(paisDelClub) === "BRL" ? "R$" : "€";
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
