import type { Metadata } from "next";
import { ListaVistaPrevia } from "../ListaVistaPrevia";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Pagina() {
  return <ListaVistaPrevia esNecesidad={false} />;
}
