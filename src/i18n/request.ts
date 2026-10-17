import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { mensajesDe } from "@/i18n/mensajes";
import { routing } from "@/i18n/routing";

/**
 * Fase 14: cómo carga next-intl los textos en cada petición (Server
 * Components, Server Actions, `generateMetadata`, el propio middleware).
 *
 * Cómo están repartidos los mensajes y cómo se funde lo que falta con
 * el español: `mensajes.ts`.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale;
  const locale = hasLocale(routing.locales, solicitado) ? solicitado : routing.defaultLocale;

  return {
    locale,
    messages: await mensajesDe(locale),
  };
});
