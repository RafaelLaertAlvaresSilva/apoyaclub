import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegistroClubForm } from "./RegistroClubForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.titulos");
  return { title: t("registroClub") };
}

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Es el mismo reparto que ya tenía /login. */
export default function RegistroClubPage() {
  return <RegistroClubForm />;
}
