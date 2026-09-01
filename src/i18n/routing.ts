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
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
