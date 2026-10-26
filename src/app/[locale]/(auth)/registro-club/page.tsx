import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { origenDeCampana } from "@/lib/piloto";
import { RegistroClubForm } from "./RegistroClubForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.titulos");
  return { title: t("registroClub") };
}

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Es el mismo reparto que ya tenía /login. */
export default async function RegistroClubPage({
  searchParams,
}: {
  searchParams: Promise<{ piloto?: string; a?: string }>;
}) {
  // Desde apoyaclub.com/6mesesgratis: el formulario lo dice arriba y manda la
  // marca. Si ya no quedan plazas lo decide el servidor al registrar.
  // `a` = de qué anuncio de la campaña llega (ver `origenDeCampana`).
  const { piloto, a } = await searchParams;
  return <RegistroClubForm piloto={piloto === "1"} origen={origenDeCampana(a)} />;
}
