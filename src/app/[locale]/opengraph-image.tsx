import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { imagenDeMarca } from "@/lib/imagen-de-marca";

/**
 * La imagen que sale al pegar un enlace de ApoyaClub en WhatsApp.
 *
 * Es la de por defecto: cualquier página que no tenga la suya propia
 * usa esta. Las fichas de club tienen la suya (escudo y nombre) y
 * /para-clubes también (la que se manda a un club).
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ApoyaClub — Conecta tu club deportivo con empresas patrocinadoras";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: pedido } = await params;
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "common.imagenCompartir" });
  return imagenDeMarca({ locale, titular: t("titular"), etiqueta: t("gratis"), eslogan: t("eslogan") });
}
