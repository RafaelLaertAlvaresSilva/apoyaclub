import type { Metadata } from "next";
import { parametrosAFiltros, type ParametrosURL } from "@/lib/buscar-params";
import { buscarOportunidades, obtenerOpcionesEquipo, obtenerProvinciasDisponibles } from "@/lib/search";
import { FiltrosBuscador } from "./components/FiltrosBuscador";
import { ResultadosBuscador } from "./components/ResultadosBuscador";

export const metadata: Metadata = {
  title: "Buscar oportunidades de patrocinio — ApoyaClub",
  description:
    "Encuentra clubes deportivos que buscan patrocinador. Filtra por deporte, ubicación, presupuesto, forma de colaboración y objetivo.",
};

// Depende de los filtros de la URL de cada visita: no tiene sentido cachearla.
export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 20;

export default async function PaginaBuscar({ searchParams }: { searchParams: Promise<ParametrosURL> }) {
  const params = await searchParams;
  const { filtros, vista } = parametrosAFiltros(params);

  const [pagina, opcionesEquipo, provincias] = await Promise.all([
    buscarOportunidades(filtros, { offset: 0, limite: TAMANO_PAGINA }),
    obtenerOpcionesEquipo(),
    obtenerProvinciasDisponibles(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Buscar oportunidades de patrocinio</h1>
          <p className="mt-2 text-zinc-600">
            Filtra por deporte, ubicación, presupuesto y objetivo para encontrar el club que mejor encaja con tu marca.
          </p>
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
