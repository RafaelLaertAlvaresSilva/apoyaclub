import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { ListadoDeOportunidades } from "../club/[slug]/components/ListadoDeOportunidades";
import { AvisoVistaPrevia } from "./AvisoVistaPrevia";
import { vistaPreviaDelClub } from "./datos";

/** Las listas de oportunidades o de necesidades, en vista previa. Igual
 * que las públicas (`club/[slug]/oportunidades` y `/necesidades`). */
export async function ListaVistaPrevia({ esNecesidad }: { esNecesidad: boolean }) {
  const locale = await getLocale();
  const t = await getTranslations("club.listas");
  const { datos, esPublica } = await vistaPreviaDelClub();
  const { perfil } = datos;
  const delListado = datos.oportunidades.filter(
    (una) => una.status === "available" && una.esNecesidad === esNecesidad,
  );
  const clave = esNecesidad ? "necesidades" : "oportunidades";

  return (
    <>
      <AvisoVistaPrevia
        motivo={esPublica ? null : "paginaOculta"}
        urlPublica={esPublica ? `/${locale}/club/${perfil.slug}/${clave}` : null}
      />
      <div className="flex flex-1 flex-col bg-zinc-50">
        <Header />

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6">
          <nav className="text-sm text-zinc-500">
            <Link href="/vista-previa" className="font-medium text-accion-tinta hover:underline">
              {perfil.name}
            </Link>
          </nav>

          <h1 className="mt-3 text-2xl font-bold text-zinc-900 sm:text-3xl">{t(`${clave}.titulo`)}</h1>
          <p className="mt-2 max-w-2xl text-zinc-600">{t(`${clave}.intro`)}</p>

          <div className="mt-6">
            <ListadoDeOportunidades
              oportunidades={delListado}
              slug={perfil.slug}
              paisDelClub={perfil.country}
              nombreClub={perfil.name}
              esNecesidad={esNecesidad}
              base="/vista-previa"
            />
          </div>
        </div>
      </div>
    </>
  );
}
