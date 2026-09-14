import type { Metadata } from "next";
import { RecuperarPasswordForm } from "./RecuperarPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Es el mismo reparto que ya tenía /login. */
export default function RecuperarPasswordPage() {
  return <RecuperarPasswordForm />;
}
