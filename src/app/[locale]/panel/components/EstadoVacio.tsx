import { TRAZOS_DEL_MENU } from "./iconos-del-panel";

/**
 * Lo que se ve cuando una lista del panel está vacía: el icono del
 * apartado en un círculo y el texto de siempre, centrado.
 *
 * Antes era una línea de texto gris dentro de un recuadro de rayas, que
 * parece un error o una página a medio hacer. Así se lee como lo que
 * es: un sitio que está esperando a que el club empiece.
 */
export function EstadoVacio({ icono, children }: { icono: string; children: React.ReactNode }) {
  const trazo = TRAZOS_DEL_MENU[icono];
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      {trazo && (
        <span className="relative mb-4 flex size-16 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-8 ring-teal-50/50">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <path d={trazo} />
          </svg>
        </span>
      )}
      <div className="max-w-md text-sm leading-relaxed text-zinc-600">{children}</div>
    </div>
  );
}
