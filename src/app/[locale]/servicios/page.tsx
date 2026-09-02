import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import {
  CATEGORIAS_SERVICIO,
  ETIQUETA_CATEGORIA_SERVICIO,
  buscarServicios,
  esCategoriaValida,
} from "@/lib/service-needs";
import { obtenerProvinciasDisponibles } from "@/lib/search";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Lo que los clubes necesitan, para una empresa (migración 0016).
 *
 * El buscador de patrocinio va de dinero: la empresa paga y el club le da
 * visibilidad. Esta página va de lo contrario, y es la puerta de entrada
 * de la empresa pequeña: una clínica de fisioterapia, una furgoneta, una
 * imprenta. No hay presupuesto de patrocinio de por medio, pero sí un
 * acuerdo posible.
 */

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("servicios.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

export const dynamic = "force-dynamic";

type ParametrosURL = { [clave: string]: string | string[] | undefined };

function unParametro(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto?.trim() || undefined;
}

export default async function PaginaServicios({
  searchParams,
}: {
  searchParams: Promise<ParametrosURL>;
}) {
  const params = await searchParams;
  const t = await getTranslations("servicios");

  const categoriaParam = unParametro(params.categoria);
  const categoria = categoriaParam && esCategoriaValida(categoriaParam) ? categoriaParam : undefined;
  const provincia = unParametro(params.provincia);

  const supabase = createPublicClient();
  const [servicios, provincias] = await Promise.all([
    buscarServicios(supabase, { categoria, provincia }),
    obtenerProvinciasDisponibles(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">{t("titulo")}</h1>
          <p className="mt-2 max-w-2xl text-zinc-600">{t("texto")}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Filtros: un formulario normal con GET, sin estado en cliente. */}
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("filtroCategoria")}</span>
            <select
              name="categoria"
              defaultValue={categoria ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">{t("todasLasCategorias")}</option>
              {CATEGORIAS_SERVICIO.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("filtroProvincia")}</span>
            <select
              name="provincia"
              defaultValue={provincia ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">{t("todaEspana")}</option>
              {provincias.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
          >
            {t("filtrar")}
          </button>

          <Link href="/buscar" className="ml-auto text-sm font-medium text-brand-teal-dark hover:underline">
            {t("verPatrocinios")}
          </Link>
        </form>

        {servicios.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="font-medium text-zinc-900">{t("vacioTitulo")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("vacioTexto")}</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {servicios.map((servicio) => (
              <li key={servicio.id} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
                  {ETIQUETA_CATEGORIA_SERVICIO[servicio.category]}
                </p>
                <p className="font-semibold text-zinc-900">{servicio.title}</p>
                {servicio.description && (
                  <p className="text-sm text-zinc-600">{servicio.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <div className="min-w-0">
                    <Link
                      href={`/club/${servicio.clubSlug}`}
                      className="text-sm font-medium text-zinc-700 hover:underline"
                    >
                      {servicio.clubName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {[servicio.clubCity, servicio.clubProvince].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <Link
                    href={`/club/${servicio.clubSlug}`}
                    className="rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy"
                  >
                    {t("verClub")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
