import { createTranslator, hasLocale } from "next-intl";
import { LOCALE_CONFIG } from "@/config/locales";
import { mensajesDe } from "@/i18n/mensajes";
import { routing, type AppLocale } from "@/i18n/routing";
import type { TraducirAlcance } from "@/lib/alcance";
import { etiquetador, type Etiquetas } from "@/lib/etiquetas-traducidas";
import { formatoDeValor } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export type Traducir = (clave: string, valores?: Record<string, string | number>) => string;

/**
 * Todo lo que necesita un documento generado en el servidor (el dossier
 * y el informe, en PDF y en Word) para salir en un idioma.
 *
 * Esos documentos no se pintan dentro de una página, así que no tienen
 * a mano `getTranslations`: esto les da lo mismo a partir del idioma de
 * la ruta, con los mismos archivos de `messages/` y con el español
 * debajo para lo que falte.
 */
export type TextosDocumento = {
  locale: AppLocale;
  intlLocale: string;
  /** Los textos de `panel.documentos.<documento>`. */
  t: Traducir;
  /** Los textos del informe de alcance, para `lib/alcance.ts`. */
  tAlcance: TraducirAlcance;
  /** Las etiquetas de los catálogos fijos (`common.etiquetas`). */
  E: Etiquetas;
  numero: Intl.NumberFormat;
  precio: Intl.NumberFormat;
  /** "3 de octubre de 2026", en la hora del mercado de ese idioma. */
  fechaLarga: (fecha: Date) => string;
  /** El nombre de un nivel de patrocinador; el que el club escribió a mano se deja tal cual. */
  nivelPatrocinador: (etiqueta: string) => string;
  /** "Femenino", "Women’s": el sexo de un equipo; lo que no sea de la lista se deja tal cual. */
  sexo: (valor: string) => string;
  /** La ficha pública del club en ese idioma. */
  urlDelClub: (slug: string) => string;
};

/**
 * Los niveles fijos de patrocinador llegan de `lib/` en español
 * (`etiquetaNivelPatrocinador`). Igual que en la ficha pública del club.
 */
const NIVELES_FIJOS: Record<string, "principal" | "oficial" | "colaborador"> = {
  "Patrocinador principal": "principal",
  "Patrocinador oficial": "oficial",
  Colaborador: "colaborador",
};

/** Los valores que se guardan tal cual (en español) en `club_teams.gender`. */
const SEXOS = ["Masculino", "Femenino", "Mixto"];

export function localeValido(valor: string | null | undefined): AppLocale {
  return hasLocale(routing.locales, valor) ? valor : routing.defaultLocale;
}

export async function textosDeDocumento(
  idioma: string | null | undefined,
  documento: "dossier" | "informe",
): Promise<TextosDocumento> {
  const locale = localeValido(idioma);
  const config = LOCALE_CONFIG[locale];
  const traductor = createTranslator({ locale, messages: await mensajesDe(locale) });
  // Sin los tipos de cada clave: las claves llegan armadas al vuelo.
  const traducir = traductor as unknown as Traducir;

  const E = etiquetador((clave) => traducir(`common.etiquetas.${clave}`));
  const formatoFecha = new Intl.DateTimeFormat(config.intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: config.timeZone,
  });

  return {
    locale,
    intlLocale: config.intlLocale,
    t: (clave, valores) => traducir(`panel.documentos.${documento}.${clave}`, valores),
    tAlcance: (clave, valores) => traducir(`panel.alcance.informe.${clave}`, valores),
    E,
    numero: new Intl.NumberFormat(config.intlLocale),
    precio: formatoDeValor(locale),
    fechaLarga: (fecha) => formatoFecha.format(fecha),
    nivelPatrocinador: (etiqueta) => (NIVELES_FIJOS[etiqueta] ? E.nivelPatrocinio(NIVELES_FIJOS[etiqueta]) : etiqueta),
    sexo: (valor) => (SEXOS.includes(valor) ? traducir(`panel.perfil.sexo.${valor}`) : valor),
    urlDelClub: (slug) => `${SITE_URL}/${locale}/club/${slug}`,
  };
}
