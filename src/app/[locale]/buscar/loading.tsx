import { Header } from "@/components/Header";
import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/**
 * Esqueleto del buscador (Fase 15). Es la pantalla más lenta de la
 * aplicación: cuando la búsqueda lleva radio, primero se geocodifica la
 * ciudad y solo después se consulta. Sin esto, el usuario veía la
 * página anterior congelada.
 *
 * Pinta la cabecera, aunque no esté cargando: va dentro de la página y
 * no del armazón común, así que sin esto desaparece mientras se busca y
 * vuelve al terminar. El parpadeo se nota mucho y da sensación de web
 * inestable justo en la pantalla que más tarda.
 */
export default function CargandoBuscador() {
  return (
    <CargandoRegion etiqueta="Buscando oportunidades…">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <div className="hidden flex-col gap-4 lg:flex">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 5 }).map((_, indice) => (
            <div key={indice} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-6 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </CargandoRegion>
  );
}
