import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/** Esqueleto del área de empresa (perfil, favoritos y solicitudes) (Fase 15). */
export default function CargandoEmpresa() {
  return (
    <CargandoRegion etiqueta="Cargando tu área de empresa…">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, indice) => (
          <div key={indice} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </CargandoRegion>
  );
}
