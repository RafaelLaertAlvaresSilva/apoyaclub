import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { LOCALE_CONFIG } from "@/config/locales";
import type { AppLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { obtenerOfertasPublicas } from "@/lib/empresas";
import { createPublicClient } from "@/lib/supabase/public";
import { ContactoDeLaEmpresa } from "../components/ContactoDeLaEmpresa";

export const revalidate = 60;


type FilaEmpresaPublica = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
};

async function obtenerEmpresa(slug: string): Promise<FilaEmpresaPublica | null> {
  const { data } = await createPublicClient()
    .from("company_public_profiles")
    .select("id, slug, name, sector, city, province, website, description, logo_url")
    .eq("slug", slug)
    .maybeSingle<FilaEmpresaPublica>();

  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const empresa = await obtenerEmpresa(slug);
  const tMetadatos = await getTranslations("buscar.fichaEmpresa");

  if (!empresa) return { title: `${tMetadatos("noEncontrada")}` };

  return {
    title: empresa.name,
    description: empresa.description ?? tMetadatos("descripcionPorDefecto", { nombre: empresa.name }),
  };
}

/**
 * La ficha pública de una empresa (migraciones 0033 y 0046).
 *
 * Sale de `company_public_profiles`, que no trae ni el correo ni el
 * presupuesto exacto. Un club que quiera hablar con ella lo hace por
 * la web de la empresa o, más adelante, con una propuesta desde su
 * panel (`club_proposals`, migración 0033).
 */
export default async function PaginaEmpresa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const empresa = await obtenerEmpresa(slug);

  if (!empresa) notFound();

  const ofertas = await obtenerOfertasPublicas(createPublicClient(), slug);
  const t = await getTranslations("buscar.fichaEmpresa");
  const E = etiquetador(await getTranslations("common.etiquetas"));
  const locale = (await getLocale()) as AppLocale;
  const formatoEuros = new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const donde = [empresa.city, empresa.province].filter(Boolean).join(", ");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 sm:px-6 py-8">
          {empresa.logo_url && (
            <Image
              src={empresa.logo_url}
              alt={empresa.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl border border-zinc-200 bg-white object-contain p-1"
            />
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{empresa.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {[empresa.sector, donde].filter(Boolean).join(" · ") || t("empresa")}
            </p>
            {empresa.website && (
              <a
                href={empresa.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-sm font-medium text-accion-tinta hover:underline"
              >
                {t("verSuWeb")}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-8">
        {empresa.description && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">{t("quienesSon")}</h2>
            <p className="mt-2 whitespace-pre-line text-zinc-700">{empresa.description}</p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-zinc-900">{t("loQueOfrece")}</h2>

          {ofertas.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
              {t("sinOfertas")}
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {ofertas.map((oferta) => (
                <li key={oferta.id} className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accion-tinta">
                    {E.tipoOferta(oferta.tipo)}
                    {oferta.categoria && ` · ${E.categoriaNecesidad(oferta.categoria)}`}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-900">{oferta.titulo}</p>
                  {oferta.descripcion && (
                    <p className="mt-1 text-sm text-zinc-600">{oferta.descripcion}</p>
                  )}
                  {oferta.pideACambio && (
                    <p className="mt-2 text-sm text-zinc-700">
                      <span className="font-medium">{t("aCambio")} </span>
                      {oferta.pideACambio}
                    </p>
                  )}
                  {oferta.tipo === "money" && oferta.valor != null && (
                    <p className="mt-2 text-sm font-semibold text-zinc-900">
                      {formatoEuros.format(oferta.valor)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lo que faltaba: sin esto el club leía la oferta, le
            encajaba, y no tenía a dónde ir. */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">{t("hablarConEstaEmpresa")}</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-600">
            {t("hablarTexto")}
          </p>
          <ContactoDeLaEmpresa slug={empresa.slug} />
        </section>

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/empresas" className="font-medium text-accion-tinta hover:underline">
            {t("verTodas")}
          </Link>
        </p>
      </div>
    </div>
  );
}
