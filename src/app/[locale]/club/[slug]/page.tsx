import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALE_CONFIG, LANG_HTML } from "@/config/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { FichaDelClub } from "./components/FichaDelClub";
import { deportesDelClub, obtenerClubPublico } from "./data";

export const revalidate = 60;

function recortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const cortado = texto.slice(0, maximo);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : maximo)}…`;
}

type ParametrosRuta = { params: Promise<{ locale: AppLocale; slug: string }> };

export async function generateMetadata({ params }: ParametrosRuta): Promise<Metadata> {
  const { locale, slug } = await params;
  const datos = await obtenerClubPublico(slug);
  const tMeta = await getTranslations("club.meta");

  if (!datos) {
    return { title: tMeta("noEncontrado") };
  }

  const { perfil, equipos } = datos;
  const E = etiquetador(await getTranslations("common.etiquetas"));
  const deportes = deportesDelClub(equipos).map(E.deporte);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const resumen = [perfil.name, deportes.join(", "), ubicacion].filter(Boolean).join(" · ");
  const descripcion = perfil.description
    ? recortar(perfil.description, 160)
    : tMeta("descripcionPorDefecto", { resumen });
  const titulo = tMeta("titulo", { club: perfil.name });
  const ruta = `/${locale}/club/${perfil.slug}`;

  return {
    // Solo el nombre: la plantilla del layout ya añade "| ApoyaClub". El
    // título con la marca (`titulo`) queda para la tarjeta al compartir,
    // que no pasa por la plantilla.
    title: perfil.name,
    description: descripcion,
    // La misma ficha en los otros idiomas, para que Google enseñe a cada
    // uno la suya en vez de tratarlas como páginas repetidas.
    alternates: {
      canonical: ruta,
      languages: Object.fromEntries(
        routing.locales.map((otro) => [LANG_HTML[otro], `/${otro}/club/${perfil.slug}`]),
      ),
    },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: ruta,
      siteName: "ApoyaClub",
      locale: LOCALE_CONFIG[locale].intlLocale.replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export default async function PaginaPublicaClub({ params }: ParametrosRuta) {
  const { locale, slug } = await params;
  const datos = await obtenerClubPublico(slug);
  if (!datos) notFound();

  return <FichaDelClub locale={locale} datos={datos} />;
}
