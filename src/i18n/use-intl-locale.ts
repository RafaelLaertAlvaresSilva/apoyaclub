import { useLocale } from "next-intl";
import { intlLocaleDe } from "@/config/locales";

/**
 * El código de idioma para `Intl` ("es-ES", "pt-PT", "en-GB") del idioma
 * en el que se está viendo la página. Para números y fechas en
 * componentes de cliente.
 */
export function useIntlLocale(): string {
  return intlLocaleDe(useLocale());
}
