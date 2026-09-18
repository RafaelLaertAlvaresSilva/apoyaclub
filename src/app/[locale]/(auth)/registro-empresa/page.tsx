import type { Metadata } from "next";
import { RegistroEmpresaForm } from "./RegistroEmpresaForm";

export const metadata: Metadata = {
  title: "Registra tu empresa",
};

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Mismo reparto que /registro-club y /login. */
export default function RegistroEmpresaPage() {
  return <RegistroEmpresaForm />;
}
