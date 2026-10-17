import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { LOCALE_CONFIG } from "@/config/locales";
import type { AppLocale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import {
  buscarOfertasDeEmpresas,
  provinciasConOfertas,
  TIPOS_DE_OFERTA,
  leerTipoDeOferta,
  type OfertaPublica,
} from "@/lib/empresas";
import { CATEGORIAS_NECESIDAD, leerCategoriaNecesidad } from "@/lib/opportunities";
import { createPublicClient } from "@/lib/supabase/public";

export async function generateMetadata(): Promise<Metadata> {
  const tMetadatos = await getTranslations("buscar.directorioEmpresas");
  return { title: tMetadatos("metaTitulo"), description: tMetadatos("metaDescripcion") };
}

export const dynamic = "force-dynamic";


type ParametrosURL = { [clave: string]: string | string[] | undefined };

function unParametro(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto?.trim() || undefined;
}

/**
 * Lo que ofrecen las empresas (migración 0046).
 *
 * El espejo de /servicios. Allí el club dice lo que necesita; aquí la
 * empresa dice lo que puede poner. Las dos páginas usan el mismo
 * catálogo de categorías a propósito: es lo que permite que un club que
 * busca fisioterapia encuentre a la clínica que la ofrece.
 */
export default async function PaginaEmpresas({
  searchParams,
}: {
  searchParams: Promise<ParametrosURL>;
}) {
  const params = await searchParams;
  const t = await getTranslations("buscar.directorioEmpresas");
  const E = etiquetador(await getTranslations("common.etiquetas"));

  const categoriaParam = unParametro(params.categoria);
  const categoria = categoriaParam ? (leerCategoriaNecesidad(categoriaParam) ?? undefined) : undefined;
  const tipoParam = unParametro(params.tipo);
  const tipo = tipoParam ? (leerTipoDeOferta(tipoParam) ?? undefined) : undefined;
  const provincia = unParametro(params.provincia);

  const supabase = createPublicClient();
  const [ofertas, provincias] = await Promise.all([
    buscarOfertasDeEmpresas(supabase, { categoria, provincia, tipo }),
    provinciasConOfertas(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            {t("titulo")}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            {t("intro")}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-6">
        {/* Filtros: un formulario normal con GET, sin estado en cliente. */}
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("queBuscas")}</span>
            <select
              name="categoria"
              defaultValue={categoria ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">{t("todo")}</option>
              {CATEGORIAS_NECESIDAD.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {E.categoriaNecesidad(opcion.id)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("deQueTipo")}</span>
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">{t("cualquiera")}</option>
              {TIPOS_DE_OFERTA.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {E.tipoOferta(opcion.id)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("provincia")}</span>
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
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-brand-navy"
          >
            {t("filtrar")}
          </button>
        </form>

        {ofertas.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="font-medium text-zinc-900">{t("vacioTitulo")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              {t("vacioTexto")}
            </p>
            <Link
              href="/registro-empresa"
              className="mt-4 inline-block rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-brand-navy"
            >
              {t("publicarLoQueOfrezco")}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {ofertas.map((oferta) => (
              <TarjetaOfertaPublica key={oferta.id} oferta={oferta} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

async function TarjetaOfertaPublica({ oferta }: { oferta: OfertaPublica }) {
  const t = await getTranslations("buscar.directorioEmpresas");
  const E = etiquetador(await getTranslations("common.etiquetas"));
  const locale = (await getLocale()) as AppLocale;
  const formatoEuros = new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-accion-tinta">
        {E.tipoOferta(oferta.tipo)}
        {oferta.categoria && ` · ${E.categoriaNecesidad(oferta.categoria)}`}
      </p>

      <p className="font-semibold text-zinc-900">{oferta.titulo}</p>

      {oferta.descripcion && <p className="text-sm text-zinc-600">{oferta.descripcion}</p>}

      {oferta.pideACambio && (
        <p className="text-sm text-zinc-700">
          <span className="font-medium">{t("aCambio")} </span>
          {oferta.pideACambio}
        </p>
      )}

      {oferta.tipo === "money" && oferta.valor != null && (
        <p className="text-sm font-semibold text-zinc-900">{formatoEuros.format(oferta.valor)}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <Link
            href={`/empresas/${oferta.empresaSlug}`}
            className="text-sm font-medium text-zinc-700 hover:underline"
          >
            {oferta.empresaNombre}
          </Link>
          <p className="text-xs text-zinc-500">
            {[oferta.empresaLocalidad, oferta.provincia].filter(Boolean).join(", ") || t("todaEspana")}
          </p>
        </div>
        <Link
          href={`/empresas/${oferta.empresaSlug}`}
          className="rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-medium text-sobre-color transition-colors hover:bg-brand-navy"
        >
          {t("verEmpresa")}
        </Link>
      </div>
    </li>
  );
}
