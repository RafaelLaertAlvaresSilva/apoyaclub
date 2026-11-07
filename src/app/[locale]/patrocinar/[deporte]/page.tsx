import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { clubesDe } from "@/lib/patrocinar";
import { datosDePatrocinio } from "../datos";
import { PaginaDePatrocinio } from "../PaginaDePatrocinio";

// Se rehace cada hora: los clubes cambian, pero no cada minuto.
export const revalidate = 3600;

type Parametros = { params: Promise<{ locale: string; deporte: string }> };

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { deporte } = await params;
  const { locale, clubes, nombreDe } = await datosDePatrocinio();
  const suyos = clubesDe(clubes, deporte);
  if (!nombreDe[deporte] || suyos.length === 0) return { robots: { index: false } };
  const t = await getTranslations("buscar.patrocinar");
  return {
    title: t("h1Deporte", { deporte: nombreDe[deporte] }),
    description: t("metaDescripcionDeporte", { n: suyos.length, deporte: nombreDe[deporte] }),
    alternates: { canonical: `/${locale}/patrocinar/${deporte}` },
  };
}

export default async function PaginaPatrocinarDeporte({ params }: Parametros) {
  const { deporte } = await params;
  const { locale, clubes, todas, nombreDe, nombreEnBuscador } = await datosDePatrocinio();
  const suyos = clubesDe(clubes, deporte);
  if (!nombreDe[deporte] || suyos.length === 0) notFound();

  return (
    <PaginaDePatrocinio
      locale={locale}
      deporte={deporte}
      nombreDeporte={nombreDe[deporte]}
      deporteEnBuscador={nombreEnBuscador[deporte]}
      zona={null}
      nombreZona={null}
      clubes={suyos}
      otrasZonas={todas.filter((una) => una.deporte === deporte && una.zona)}
      otrosDeportes={[]}
      nombreDe={nombreDe}
    />
  );
}
