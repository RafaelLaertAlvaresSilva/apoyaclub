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
        className={`rounded-lg border border-zinc-300 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 ${
          ancho ? "w-full rounded-xl px-4 py-3.5 text-base" : "px-4 py-2 text-sm"
        }`}
      >
        {t("cerrarSesion")}
      </button>
    </form>
  );
}
