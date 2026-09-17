import { BarraLogo } from "@/components/BarraLogo";
import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/**
 * Esqueleto del panel del club mientras se cargan perfil y estado de
 * suscripción (Fase 15).
 *
 * Mismo ancho, mismo margen y mismo fondo gris que la página real: si
 * no coinciden, el contenido salta de sitio justo cuando termina de
 * cargar, que es exactamente lo que el esqueleto viene a evitar.
 */
export default function CargandoPanel() {
  return (
    <CargandoRegion etiqueta="Cargando tu panel…">
      <BarraLogo />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
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
