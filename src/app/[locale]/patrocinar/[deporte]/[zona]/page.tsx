import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { clubesDe } from "@/lib/patrocinar";
import { datosDePatrocinio } from "../../datos";
import { PaginaDePatrocinio } from "../../PaginaDePatrocinio";

export const revalidate = 3600;

type Parametros = { params: Promise<{ locale: string; deporte: string; zona: string }> };

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { deporte, zona } = await params;
  const { locale, clubes, nombreDe } = await datosDePatrocinio();
  const suyos = clubesDe(clubes, deporte, zona);
  if (!nombreDe[deporte] || suyos.length === 0) return { robots: { index: false } };
  const nombreZona = suyos[0].province ?? zona;
  const t = await getTranslations("buscar.patrocinar");
  return {
    title: t("h1Zona", { deporte: nombreDe[deporte], zona: nombreZona }),
    description: t("metaDescripcionZona", { n: suyos.length, deporte: nombreDe[deporte], zona: nombreZona }),
    alternates: { canonical: `/${locale}/patrocinar/${deporte}/${zona}` },
  };
}

export default async function PaginaPatrocinarDeporteEnZona({ params }: Parametros) {
  const { deporte, zona } = await params;
  const { locale, clubes, todas, nombreDe, nombreEnBuscador } = await datosDePatrocinio();
  const suyos = clubesDe(clubes, deporte, zona);
  if (!nombreDe[deporte] || suyos.length === 0) notFound();

  return (
    <PaginaDePatrocinio
      locale={locale}
      deporte={deporte}
      nombreDeporte={nombreDe[deporte]}
      deporteEnBuscador={nombreEnBuscador[deporte]}
      zona={zona}
      nombreZona={suyos[0].province ?? zona}
      clubes={suyos}
      otrasZonas={todas.filter((una) => una.deporte === deporte && una.zona && una.zona !== zona)}
      otrosDeportes={todas.filter((una) => una.zona === zona && una.deporte !== deporte)}
      nombreDe={nombreDe}
    />
  );
}
