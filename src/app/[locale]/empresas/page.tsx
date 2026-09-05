import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import {
  ETIQUETA_FRANJA,
  buscarEmpresas,
  parametrosAFiltrosEmpresas,
  provinciasConEmpresas,
} from "@/lib/directorio-empresas";
import { ETIQUETA_OBJETIVO } from "@/lib/opportunities";
import { FiltrosEmpresas } from "./components/FiltrosEmpresas";

export const metadata: Metadata = {
  title: "Empresas que quieren patrocinar — ApoyaClub",
  description:
    "Empresas abiertas a patrocinar clubes deportivos. Filtra por provincia, presupuesto y lo que quieren apoyar, y escríbeles desde tu club.",
};

// Depende de los filtros de la URL: no tiene sentido cachearla.
export const dynamic = "force-dynamic";

export default async function DirectorioEmpresas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtros = parametrosAFiltrosEmpresas(params);

  const [{ empresas }, provincias] = await Promise.all([
    buscarEmpresas(filtros),
    provinciasConEmpresas(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
          Empresas que quieren patrocinar
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Empresas que han dicho que están abiertas a apoyar a un club. Si tienes un club en
          ApoyaClub, puedes escribirles directamente desde aquí.
        </p>

        <div className="mt-6">
          <FiltrosEmpresas filtros={filtros} provincias={provincias} />
        </div>

        {empresas.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="font-medium text-zinc-900">Todavía no hay ninguna empresa aquí</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              El directorio acaba de abrir. Si tienes una empresa, puedes apuntarte desde tu perfil
              en un minuto y empezar a recibir propuestas de clubes de tu zona.
            </p>
            <Link
              href="/registro"
              className="mt-4 inline-block rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
            >
              Registrar mi empresa
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {empresas.map((empresa) => (
              <li key={empresa.id}>
                <Link
                  href={`/empresas/${empresa.slug}`}
                  className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-teal-400"
                >
                  <div className="flex items-start gap-3">
                    {empresa.logoUrl ? (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1">
                        <Image
                          src={empresa.logoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-700">
                        {empresa.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900">{empresa.name}</p>
                      <p className="text-sm text-zinc-500">
                        {[empresa.sector, empresa.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>

                  {empresa.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-600">{empresa.description}</p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {empresa.budgetBand && (
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                        {ETIQUETA_FRANJA[empresa.budgetBand]}
                      </span>
                    )}
                    {empresa.objectives.slice(0, 3).map((objetivo) => (
                      <span
                        key={objetivo}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
                      >
                        {ETIQUETA_OBJETIVO[objetivo]}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
