import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/** Esqueleto del panel del club mientras se cargan perfil y estado de suscripción (Fase 15). */
export default function CargandoPanel() {
  return (
    <CargandoRegion etiqueta="Cargando tu panel…">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-full max-w-md" />
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ))}
      </div>
    </CargandoRegion>
  );
}
