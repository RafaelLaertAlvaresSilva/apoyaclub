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

export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale;
  const locale = hasLocale(routing.locales, solicitado) ? solicitado : routing.defaultLocale;

  const modulos = await Promise.all(
    MODULOS.map(async (nombre) => {
      const modulo = await import(`../../messages/${locale}/${nombre}.json`);
      return [nombre, modulo.default] as const;
    }),
  );

  return {
    locale,
    messages: Object.fromEntries(modulos),
  };
});
