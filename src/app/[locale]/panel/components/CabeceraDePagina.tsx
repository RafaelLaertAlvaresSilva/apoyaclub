import type { ReactNode } from "react";
import { TRAZOS_DEL_MENU } from "./iconos-del-panel";

/**
 * La cabecera de cada página del panel: el icono del apartado (el mismo
 * del menú), la etiqueta, el título y una línea de para qué sirve.
 *
 * Estaba copiada a mano en las doce páginas, cada una con su pequeña
 * diferencia. Una sola pieza hace que todas se vean igual, que es lo
 * que distingue una herramienta cuidada de una hecha a trozos.
 */
export function CabeceraDePagina({
  icono,
  etiqueta,
  titulo,
  texto,
  accion,
}: {
  /** La clave del apartado en `TRAZOS_DEL_MENU`. */
  icono: string;
  etiqueta: string;
  titulo: string;
  texto?: ReactNode;
  /** Un botón a la derecha (por ejemplo, "Nueva oportunidad"). */
  accion?: ReactNode;
}) {
  const trazo = TRAZOS_DEL_MENU[icono];
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {trazo && (
          <span className="mt-0.5 flex size-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal-dark to-brand-navy text-sobre-color shadow-md shadow-brand-teal/20">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d={trazo} />
            </svg>
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{etiqueta}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-titular sm:text-3xl">{titulo}</h1>
          {texto && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600">{texto}</p>}
        </div>
      </div>
      {accion && <div className="flex-none">{accion}</div>}
    </div>
  );
}
