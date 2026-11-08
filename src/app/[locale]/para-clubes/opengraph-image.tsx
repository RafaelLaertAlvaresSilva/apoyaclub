import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { imagenDeMarca } from "@/lib/imagen-de-marca";

/**
 * La imagen al compartir /para-clubes (pedido por Rafael el 8-11-2026):
 * es el enlace que se manda a un club (el "invítalo por WhatsApp" del
 * buscador, los mensajes de captación), así que habla al club y no a
 * la empresa.
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ApoyaClub — Para clubes";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: pedido } = await params;
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "common.imagenCompartir" });
  return imagenDeMarca({
    locale,
    titular: t("titularClubes"),
    etiqueta: t("gratisClubes"),
    eslogan: t("eslogan"),
  });
}
