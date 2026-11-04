import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { FichaDelClub } from "../club/[slug]/components/FichaDelClub";
import { AvisoVistaPrevia } from "./AvisoVistaPrevia";
import { vistaPreviaDelClub } from "./datos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * La ficha del club tal y como la verá una empresa, aunque ahora mismo
 * no se vea en público (modo de pruebas, oculta por el club, sin
 * suscripción). Solo la ve el propio club, con su sesión.
 */
export default async function VistaPreviaDelClub() {
  const locale = (await getLocale()) as AppLocale;
  const { datos, esPublica } = await vistaPreviaDelClub();

  return (
    <>
      <AvisoVistaPrevia
        motivo={esPublica ? null : "paginaOculta"}
        urlPublica={esPublica ? `/${locale}/club/${datos.perfil.slug}` : null}
      />
      <FichaDelClub locale={locale} datos={datos} vistaPrevia />
    </>
  );
}
