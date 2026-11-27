import { useTranslations } from "next-intl";
import { CargandoRegion, Skeleton } from "@/components/ui/Skeleton";

/**
 * Lo que se ve mientras carga una pantalla del panel.
 *
 * Va dentro del layout del panel (el menú y la barra de arriba se
 * quedan), así que aquí solo la forma de una página normal: la cabecera
 * con su icono y título, y unos bloques. Antes traía su propia barra del
 * logo y su propio ancho, y al cambiar de pantalla aparecía un segundo
 * logo dentro del contenido y todo saltaba de sitio.
 */
export default function CargandoPanel() {
  const t = useTranslations("panel.menu");
  return (
    <CargandoRegion etiqueta={t("cargandoPanel")}>
      <div className="flex w-full flex-1 flex-col gap-6 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-64 max-w-full" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, indice) => (
          <div key={indice} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ))}
      </div>
    </CargandoRegion>
  );
}
