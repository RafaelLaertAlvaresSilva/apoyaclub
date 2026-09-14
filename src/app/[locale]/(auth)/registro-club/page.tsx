import type { Metadata } from "next";
import { RegistroClubForm } from "./RegistroClubForm";

export const metadata: Metadata = {
  title: "Crea la página de tu club",
};

/* El formulario vive aparte porque necesita ejecutarse en el navegador,
 * y una página que lo hace no puede declarar el título de la pestaña.
 * Es el mismo reparto que ya tenía /login. */
export default function RegistroClubPage() {
  return <RegistroClubForm />;
}
