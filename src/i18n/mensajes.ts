import { routing } from "@/i18n/routing";

/**
 * Los textos de la aplicación, por idioma.
 *
 * Los mensajes están repartidos en varios archivos por módulo dentro de
 * `messages/<locale>/` (no uno solo enorme) para que sean manejables:
 * `common.json` (nav, botones y textos compartidos), y uno por área de la
 * aplicación (`home`, `auth`, `club`, `buscar`, `panel`, `empresa`,
 * `admin`, `legal`, `emails`...). Aquí se fusionan todos bajo su propio
 * namespace (el nombre de archivo), así que en el código se usan como
 * `useTranslations("panel")`, `useTranslations("common")`, etc.
 *
 * Vive aparte de `request.ts` para que lo use también lo que se genera
 * fuera de una página: el dossier y el informe en PDF y en Word.
 */
export const MODULOS = [
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
  "ideas",
] as const;

/**
 * Funde dos árboles de mensajes: lo traducido manda y lo que falta se
 * queda en español.
 *
 * El administrador no está traducido. Sin esta fusión, en `/pt/admin`
 * saldrían las claves crudas o la página daría error; con ella sale el
 * texto en español, que se entiende.
 */
export type Arbol = { [clave: string]: unknown };

export function fundir(base: Arbol, encima: Arbol): Arbol {
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

/** Todos los mensajes de un idioma, con el español debajo para lo que falte. */
export async function mensajesDe(locale: string): Promise<Arbol> {
  const modulos = await Promise.all(
    MODULOS.map(async (nombre) => {
      const espanol = (await cargar(routing.defaultLocale, nombre)) ?? {};
      if (locale === routing.defaultLocale) return [nombre, espanol] as const;
      // El portugués de Brasil se apoya en el de Portugal antes que en el
      // español: un texto que todavía no esté adaptado sale en portugués.
      const base = locale === "br" ? fundir(espanol, (await cargar("pt", nombre)) ?? {}) : espanol;
      const traducido = await cargar(locale, nombre);
      return [nombre, traducido ? fundir(base, traducido) : base] as const;
    }),
  );
  return Object.fromEntries(modulos);
}
