"use client";

import { Children, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Una lista que en el ordenador enseña solo las primeras y guarda el
 * resto detrás de un "Ver más".
 *
 * Solo en el ordenador. En el teléfono la lista sale entera, como
 * siempre: ahí las tarjetas van una debajo de otra y se leen bajando el
 * dedo, que es lo natural. El recorte existe porque en el ordenador las
 * dos columnas —lo que el club ofrece y lo que busca— tienen que
 * empezar a la misma altura y verse las dos de un vistazo. Un club con
 * nueve oportunidades y dos servicios dejaría la columna de la derecha
 * flotando sola arriba del todo.
 *
 * Las que sobran no se borran del HTML, solo se esconden en el
 * ordenador: así quien llegue buscando con Ctrl+F, o un buscador, las
 * encuentra igual.
 */
export function ListaConVerMas({
  children,
  visiblesEnOrdenador = 2,
  clasesLista,
  textoVerMas,
  tono,
  href,
  cuantasEnTotal,
}: {
  children: ReactNode;
  visiblesEnOrdenador?: number;
  /** Las clases de la rejilla. Se aplican igual a las primeras y a las
   * que salen al desplegar, para que no se note la costura. */
  clasesLista: string;
  /** Ya viene con el número puesto: esto se pinta en el servidor y una
   * función no se puede cruzar hasta aquí. */
  textoVerMas: string;
  tono: "verde" | "ambar";
  /**
   * A dónde lleva "Ver todas" (migración 0049).
   *
   * Antes el botón desplegaba la lista aquí mismo. Ahora lleva a la
   * página donde están todas y desde donde se abre cada una por
   * separado, que es lo que hace falta para poder compartir una sola.
   * Se sustituye en vez de sumarse: dos botones parecidos uno al lado
   * del otro obligan a elegir sin motivo.
   */
  href: string;
  /** Cuántas hay en total, para el texto del botón. */
  cuantasEnTotal: number;
}) {
  const todos = Children.toArray(children);

  // En el teléfono la lista sigue saliendo entera; en el ordenador se
  // recorta para que las dos columnas empiecen a la misma altura.
  const [desplegado] = useState(false);

  const primeros = todos.slice(0, visiblesEnOrdenador);
  const resto = todos.slice(visiblesEnOrdenador);

  const clasesBoton =
    tono === "verde"
      ? "border-teal-300 bg-white text-teal-800 hover:bg-teal-100"
      : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100";

  return (
    <>
      <div className={clasesLista}>{primeros}</div>

      {resto.length > 0 && (
        // `mt-3` es el mismo hueco que el `gap-3` de la rejilla, así que
        // las dos mitades parecen una sola lista.
        <div className={`mt-3 ${clasesLista} ${desplegado ? "" : "lg:hidden"}`}>{resto}</div>
      )}

      {cuantasEnTotal > 0 && (
        <Link
          href={href}
          className={`mt-4 block w-full rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${clasesBoton}`}
        >
          {textoVerMas}
        </Link>
      )}
    </>
  );
}
