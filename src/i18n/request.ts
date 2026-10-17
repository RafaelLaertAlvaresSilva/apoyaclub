import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Fase 14: cómo carga next-intl los textos en cada petición (Server
 * Components, Server Actions, `generateMetadata`, el propio middleware).
 *
 * Los mensajes están repartidos en varios archivos por módulo dentro de
 * `messages/<locale>/` (no uno solo enorme) para que sean manejables:
 * `common.json` (nav, botones y textos compartidos), y uno por área de la
 * aplicación (`home`, `auth`, `club`, `buscar`, `panel`, `empresa`,
 * `admin`, `legal`, `emails`...). Aquí se fusionan todos bajo su propio
 * namespace (el nombre de archivo), así que en el código se usan como
 * `useTranslations("panel")`, `useTranslations("common")`, etc.
 */
const MODULOS = [
  "common",
  "home",
  "auth",
  "club",
  "buscar",
  "panel",
  "empresa",
  "admin",
  "legal",
  "emails",
  "servicios",
] as const;

/**
 * Funde dos árboles de mensajes: lo traducido manda y lo que falta se
 * queda en español.
 *
 * El panel, los correos y el administrador todavía no están traducidos
 * (se empezó por la parte pública). Sin esta fusión, en `/pt/panel`
 * saldrían las claves crudas (`panel.oportunidades.titulo`) o la página
 * daría error; con ella sale el texto en español, que se entiende.
 */
type Arbol = { [clave: string]: unknown };

function fundir(base: Arbol, encima: Arbol): Arbol {
  const resultado: Arbol = { ...base };
  for (const [clave, valor] of Object.entries(encima)) {
    const anterior = resultado[clave];
    // Las listas (pasos, preguntas, ventajas...) se sustituyen enteras:
    // fundirlas posición a posición mezclaría frases de dos idiomas.
    const sonObjetos =
      typeof valor === "object" &&
      valor !== null &&
      !Array.isArray(valor) &&
      typeof anterior === "object" &&
      anterior !== null &&
      !Array.isArray(anterior);
    resultado[clave] = sonObjetos ? fundir(anterior as Arbol, valor as Arbol) : valor;
  }
  return resultado;
}

async function cargar(locale: string, nombre: string): Promise<Arbol | null> {
  try {
    const modulo = await import(`../../messages/${locale}/${nombre}.json`);
    return modulo.default as Arbol;
  } catch {
    // Ese módulo todavía no existe en ese idioma.
    return null;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale;
  const locale = hasLocale(routing.locales, solicitado) ? solicitado : routing.defaultLocale;

  const modulos = await Promise.all(
    MODULOS.map(async (nombre) => {
      const espanol = (await cargar(routing.defaultLocale, nombre)) ?? {};
      if (locale === routing.defaultLocale) return [nombre, espanol] as const;
      const traducido = await cargar(locale, nombre);
      return [nombre, traducido ? fundir(espanol, traducido) : espanol] as const;
    }),
  );

  return {
    locale,
    messages: Object.fromEntries(modulos),
  };
});
