import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { beneficioEnTexto } from "@/lib/ficha-oportunidad";
import { VistaDeOportunidad } from "../../components/VistaDeOportunidad";
import { obtenerClubPublico } from "../../data";

export const revalidate = 60;

/** La oportunidad dentro de su club, o null. Se busca a través del club
 * y no por su id suelto: así hereda las condiciones de visibilidad de
 * la ficha pública, y una oportunidad de un club sin publicar no se ve
 * por tener su enlace. */
async function buscar(slug: string, id: string) {
  const datos = await obtenerClubPublico(slug);
  if (!datos) return null;

  const oportunidad = datos.oportunidades.find((una) => una.id === id);
  return oportunidad ? { ...datos, oportunidad } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const encontrado = await buscar(slug, id);

  const tp = await getTranslations("club.oportunidadPagina");
  if (!encontrado) return { title: `${tp("noEncontrada")}` };

  const { perfil, oportunidad } = encontrado;

  // Lo primero que se lee al compartirlo por WhatsApp. Si hay ficha, lo
  // que recibe la empresa cuenta mucho más que la descripción.
  const resumen =
    oportunidad.beneficios.length > 0
      ? oportunidad.beneficios.map(beneficioEnTexto).join(" · ")
      : (oportunidad.description ??
        tp("resumenPorDefecto", { club: perfil.name }));

  return {
    title: `${oportunidad.title} — ${perfil.name}`,
    description: resumen.slice(0, 300),
    openGraph: {
      title: `${oportunidad.title} — ${perfil.name}`,
      description: resumen.slice(0, 300),
      type: "website",
    },
  };
}

export default async function PaginaOportunidad({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const encontrado = await buscar(slug, id);

  if (!encontrado) notFound();

  const locale = (await getLocale()) as AppLocale;
  return <VistaDeOportunidad locale={locale} perfil={encontrado.perfil} oportunidad={encontrado.oportunidad} />;
}
