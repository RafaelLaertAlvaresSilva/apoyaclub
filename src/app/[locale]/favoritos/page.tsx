import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ListaDeGuardados } from "./ListaDeGuardados";

export const metadata: Metadata = {
  title: "Guardados",
  description: "Los clubes y las oportunidades que has guardado para mirar con calma.",
};

/**
 * Lo guardado (migración 0046).
 *
 * La página es pública a propósito y no pide cuenta: quien guarda sin
 * registrarse tiene que poder volver a ver su lista. El contenido lo
 * pinta el navegador, que es el único que sabe qué hay guardado cuando
 * no hay cuenta.
 */
export default function PaginaFavoritos() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Guardados</h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Lo que has marcado para mirar con calma.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-8">
        <ListaDeGuardados />
      </div>
    </div>
  );
}
