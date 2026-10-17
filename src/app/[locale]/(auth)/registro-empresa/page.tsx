import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegistroEmpresaForm } from "./RegistroEmpresaForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.titulos");
  return { title: t("registroEmpresa") };
}

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Mismo reparto que /registro-club y /login. */
export default function RegistroEmpresaPage() {
  return <RegistroEmpresaForm />;
}
