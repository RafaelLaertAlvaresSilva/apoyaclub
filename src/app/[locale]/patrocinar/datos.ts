import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { DEPORTES } from "@/lib/deportes";
import { clubesParaPatrocinar, combinaciones, delPais } from "@/lib/patrocinar";
import { paisDeBusquedaDelIdioma } from "@/lib/search-types";

/** Lo común de las páginas de /patrocinar: los clubes del país de la web y los nombres de los deportes. */
export async function datosDePatrocinio() {
  const locale = (await getLocale()) as AppLocale;
  const tDeporte = await getTranslations("common.etiquetas.deporte");
  const clubes = delPais(await clubesParaPatrocinar(), paisDeBusquedaDelIdioma(locale));
  const enMinuscula = (texto: string) => (locale === "en" ? texto.toLowerCase() : texto.toLocaleLowerCase(locale));
  const nombreDe = Object.fromEntries(DEPORTES.map((deporte) => [deporte.clave, enMinuscula(tDeporte(deporte.clave))]));
  const nombreEnBuscador = Object.fromEntries(DEPORTES.map((deporte) => [deporte.clave, deporte.nombre]));
  return { locale, clubes, todas: combinaciones(clubes), nombreDe, nombreEnBuscador };
}
