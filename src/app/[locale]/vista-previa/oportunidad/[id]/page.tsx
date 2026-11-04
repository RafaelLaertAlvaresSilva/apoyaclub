import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { VistaDeOportunidad } from "../../../club/[slug]/components/VistaDeOportunidad";
import { AvisoVistaPrevia } from "../../AvisoVistaPrevia";
import { vistaPreviaDelClub } from "../../datos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Una oportunidad del propio club tal y como la verá una empresa, aunque
 * no se vea en público: el club en modo de pruebas u oculto, o la
 * oportunidad reservada o cerrada. Las archivadas no: esas el club ya
 * las ha quitado de en medio.
 */
export default async function VistaPreviaDeOportunidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as AppLocale;
  const { datos, esPublica } = await vistaPreviaDelClub();

  const oportunidad = datos.oportunidades.find((una) => una.id === id);
  if (!oportunidad) notFound();

  const disponible = oportunidad.status === "available";
  const motivo = !esPublica ? "paginaOculta" : disponible ? null : "oportunidadNoDisponible";

  return (
    <>
      <AvisoVistaPrevia
        motivo={motivo}
        urlPublica={motivo ? null : `/${locale}/club/${datos.perfil.slug}/oportunidad/${oportunidad.id}`}
      />
      <VistaDeOportunidad locale={locale} perfil={datos.perfil} oportunidad={oportunidad} vistaPrevia />
    </>
  );
}
