import { Header } from "@/components/Header";
import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/**
 * Esqueleto de la ficha pública del club.
 *
 * Es la página que el club enseña a una empresa, y no tenía ninguno:
 * hace varias consultas —perfil, equipos, patrocinadores,
 * oportunidades, servicios, partidos— antes de pintar nada, así que se
 * quedaba en blanco un momento. En blanco, una web parece rota; con la
 * forma de lo que viene, parece que está cargando.
 *
 * Copia la forma de la página de verdad —portada apaisada, logo debajo,
 * botones y el recuadro de oportunidades— para que al llegar el
 * contenido no salte nada de sitio.
 */
export default function CargandoFichaDeClub() {
  return (
    <CargandoRegion etiqueta="Cargando la página del club…">
      <Header />

      <div className="h-64 w-full bg-zinc-100 sm:h-80" />

      <div className="mx-auto mt-5 flex w-full max-w-5xl flex-col gap-4 px-4 sm:px-6 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-36 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap gap-2 px-4 sm:px-6">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-9 w-36 rounded-full" />
        ))}
      </div>

      <div className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8">
          <Skeleton className="h-7 w-64" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {Array.from({ length: 2 }).map((_, indice) => (
              <div key={indice} className="flex flex-col gap-2 rounded-xl border border-zinc-100 p-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1 h-9 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CargandoRegion>
  );
}
