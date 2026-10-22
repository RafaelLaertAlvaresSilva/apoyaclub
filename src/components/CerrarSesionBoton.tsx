import { useTranslations } from "next-intl";
import { cerrarSesion } from "@/app/[locale]/actions";

/**
 * @param ancho Ocupa toda la fila. Es para el cajón del menú del
 *   teléfono, donde los botones van apilados y uno a medio ancho se ve
 *   como un descuido.
 */
export function CerrarSesionBoton({ ancho = false }: { ancho?: boolean }) {
  const t = useTranslations("common.componentes");
  return (
    <form action={cerrarSesion} className={ancho ? "w-full" : undefined}>
      <button
        type="submit"
        className={`rounded-lg border border-zinc-300 bg-white font-medium text-zinc-700 shadow-sm transition-colors hover:border-accion-tinta hover:text-accion-tinta ${
          ancho ? "w-full rounded-xl px-4 py-3.5 text-base" : "px-4 py-2 text-sm"
        }`}
      >
        {t("cerrarSesion")}
      </button>
    </form>
  );
}
