import { defineRouting } from "next-intl/routing";

/**
 * Fase 14: idiomas soportados y prefijo de ruta.
 *
 * Por ahora solo hay un idioma (español), pero el prefijo va siempre en
 * la URL (`localePrefix: "always"`, así `/es/...` desde ya en vez de
 * `/...`) para no tener que cambiar ninguna URL el día que se añada el
 * segundo idioma. Añadir un idioma nuevo es: meterlo en `locales`, crear
 * su carpeta en `messages/<locale>/` y su entrada en
 * `src/config/locales.ts` — nada más, esta lista es la única fuente de
 * verdad, la usan el middleware, la navegación (`src/i18n/navigation.ts`)
 * y la carga de mensajes (`src/i18n/request.ts`).
 */
export const routing = defineRouting({
  // Español, portugués (de Portugal) e inglés. El español es el idioma
  // de referencia: lo que todavía no está traducido sale en español
  // (ver `src/i18n/request.ts`), nunca como una clave rota.
  // "br" es el portugués de Brasil (pt-BR): va en /br, que es más corto
  // de decir a un club. Para todo lo que entiende de idiomas (Intl, el
  // atributo lang, hreflang) se traduce a "pt-BR" en `src/config/locales.ts`.
  locales: ["es", "pt", "en", "br"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
