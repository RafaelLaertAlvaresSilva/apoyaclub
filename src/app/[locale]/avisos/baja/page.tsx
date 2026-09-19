import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { BajaForm } from "./BajaForm";

export const metadata: Metadata = {
  title: "Dejar de recibir avisos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Darse de baja de los avisos sin iniciar sesión (migración 0048).
 *
 * El enlace llega en el pie de cada correo. La página es pública y no
 * pide nada: quien quiere dejar de recibir correos tiene que poder
 * hacerlo en un clic, o el siguiente clic es el botón de spam.
 */
export default async function PaginaBajaDeAvisos({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = (Array.isArray(params.t) ? params.t[0] : params.t)?.trim() ?? "";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <div className="mx-auto w-full max-w-xl flex-1 px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Dejar de recibir avisos</h1>

        {token ? (
          <div className="mt-6">
            <BajaForm token={token} />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700">
            Este enlace no está completo. Ábrelo otra vez desde el correo que recibiste, o
            escríbenos a info@apoyaclub.com y lo hacemos nosotros.
          </p>
        )}
      </div>
    </div>
  );
}
