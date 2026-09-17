import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Página no encontrada | ApoyaClub",
};

/**
 * 404 general (Fase 15). Antes solo existía el 404 de la ficha de club,
 * así que cualquier otra URL equivocada caía en la pantalla por defecto
 * de Next.js, sin marca y sin salida. Se ofrecen las tres salidas
 * útiles según quién se haya perdido: inicio, buscador y panel.
 */
export default function PaginaNoEncontrada() {
  const t = useTranslations("common.componentes");
  return (
    <>
      <Header />
      <main id="contenido" className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
        <p className="text-sm font-medium text-brand-teal-dark">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">{t("estaPaginaNoExiste")}</h1>
        <p className="mt-3 max-w-md text-zinc-600">{t("puedeQueElEnlace")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-brand-navy px-6 py-3 font-medium text-white transition-colors hover:bg-brand-navy-dark"
          >{t("volverAlInicio")}</Link>
          <Link
            href="/buscar"
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 transition-colors hover:border-zinc-400"
          >{t("buscarClubes")}</Link>
        </div>
      </main>
    </>
  );
}
