import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { ListadoDeOportunidades } from "../components/ListadoDeOportunidades";
import { obtenerClubPublico } from "../data";

export const revalidate = 60;

const ES_NECESIDAD = false;
const TITULO = "Oportunidades de patrocinio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const datos = await obtenerClubPublico(slug);

  if (!datos) return { title: "Club no encontrado — ApoyaClub" };
  return { title: `${TITULO} — ${datos.perfil.name}` };
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = await obtenerClubPublico(slug);

  if (!datos) notFound();

  const { perfil, oportunidades } = datos;
  const delListado = oportunidades.filter((una) => una.esNecesidad === ES_NECESIDAD);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6">
        <nav className="text-sm text-zinc-500">
          <Link href={`/club/${perfil.slug}`} className="font-medium text-brand-teal-dark hover:underline">
            {perfil.name}
          </Link>
        </nav>

        <h1 className="mt-3 text-2xl font-bold text-zinc-900 sm:text-3xl">{TITULO}</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">Todo lo que este club puede ofrecer a una empresa, con el detalle de cada acuerdo.</p>

        <div className="mt-6">
          <ListadoDeOportunidades
            oportunidades={delListado}
            slug={perfil.slug}
            esNecesidad={ES_NECESIDAD}
          />
        </div>
      </div>
    </div>
  );
}
