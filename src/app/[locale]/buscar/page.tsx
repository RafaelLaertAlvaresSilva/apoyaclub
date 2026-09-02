import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { parametrosAFiltros, type ParametrosURL } from "@/lib/buscar-params";
import { buscarOportunidades, obtenerOpcionesEquipo, obtenerProvinciasDisponibles } from "@/lib/search";
import { FiltrosBuscador } from "./components/FiltrosBuscador";
import { ResultadosBuscador } from "./components/ResultadosBuscador";

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("buscar.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

// Depende de los filtros de la URL de cada visita: no tiene sentido cachearla.
export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 20;

export default async function PaginaBuscar({ searchParams }: { searchParams: Promise<ParametrosURL> }) {
  const params = await searchParams;
  const { filtros, vista } = parametrosAFiltros(params);
  const t = await getTranslations("buscar.cabecera");

  const [pagina, opcionesEquipo, provincias] = await Promise.all([
    buscarOportunidades(filtros, { offset: 0, limite: TAMANO_PAGINA }),
    obtenerOpcionesEquipo(),
    obtenerProvinciasDisponibles(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("titulo")}</h1>
          <p className="mt-2 text-zinc-600">{t("texto")}</p>
          {/* La otra dirección: lo que los clubes necesitan (migración 0016). */}
          <Link
            href="/servicios"
            className="mt-3 inline-block text-sm font-medium text-brand-teal-dark hover:underline"
          >
            {t("verServicios")}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
        <FiltrosBuscador
          filtrosIniciales={filtros}
          vistaInicial={vista}
          opcionesEquipo={opcionesEquipo}
          provincias={provincias}
        />

        {/* La clave fuerza a reiniciar el estado acumulado ("Cargar más") cuando cambian los filtros de la URL. */}
        <ResultadosBuscador
          key={JSON.stringify(filtros)}
          filtros={filtros}
          vistaInicial={vista}
          paginaInicial={pagina}
        />
      </div>
    </div>
  );
}
