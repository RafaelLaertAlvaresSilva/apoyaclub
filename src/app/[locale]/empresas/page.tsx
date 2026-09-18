import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import {
  buscarOfertasDeEmpresas,
  provinciasConOfertas,
  ETIQUETA_TIPO_OFERTA,
  TIPOS_DE_OFERTA,
  leerTipoDeOferta,
  type OfertaPublica,
} from "@/lib/empresas";
import { CATEGORIAS_NECESIDAD, ETIQUETA_CATEGORIA_NECESIDAD, leerCategoriaNecesidad } from "@/lib/opportunities";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Empresas que apoyan al deporte de base",
  description:
    "Empresas que ofrecen servicios, productos o patrocinio a clubes deportivos. Mira qué ofrecen y escríbeles.",
};

export const dynamic = "force-dynamic";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

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
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            Empresas
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            Empresas que apoyan al deporte de base
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Lo que cada una puede poner y qué pide a cambio. Si eres un club y algo te encaja,
            escríbele: no hace falta que tengas nada preparado.
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
            <span className="mb-1 block font-medium text-zinc-700">Qué buscas</span>
            <select
              name="categoria"
              defaultValue={categoria ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Todo</option>
              {CATEGORIAS_NECESIDAD.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">De qué tipo</span>
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Cualquiera</option>
              {TIPOS_DE_OFERTA.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Provincia</span>
            <select
              name="provincia"
              defaultValue={provincia ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Toda España</option>
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
            Filtrar
          </button>
        </form>

        {ofertas.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="font-medium text-zinc-900">Todavía no hay ninguna empresa aquí.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              Esto se llena con lo que las empresas publican. Si tienes una y puedes aportar algo a
              un club de tu barrio, empieza tú.
            </p>
            <Link
              href="/registro-empresa"
              className="mt-4 inline-block rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
            >
              Publicar lo que ofrezco
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

function TarjetaOfertaPublica({ oferta }: { oferta: OfertaPublica }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
        {ETIQUETA_TIPO_OFERTA[oferta.tipo]}
        {oferta.categoria && ` · ${ETIQUETA_CATEGORIA_NECESIDAD[oferta.categoria]}`}
      </p>

      <p className="font-semibold text-zinc-900">{oferta.titulo}</p>

      {oferta.descripcion && <p className="text-sm text-zinc-600">{oferta.descripcion}</p>}

      {oferta.pideACambio && (
        <p className="text-sm text-zinc-700">
          <span className="font-medium">A cambio: </span>
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
            {[oferta.empresaLocalidad, oferta.provincia].filter(Boolean).join(", ") || "Toda España"}
          </p>
        </div>
        <Link
          href={`/empresas/${oferta.empresaSlug}`}
          className="rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy"
        >
          Ver empresa
        </Link>
      </div>
    </li>
  );
}
