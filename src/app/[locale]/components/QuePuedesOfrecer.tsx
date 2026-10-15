"use client";

import { useState } from "react";
import { IconoDeCategoria } from "@/components/IconoDeCategoria";
import { CATEGORIAS_IDEA } from "@/lib/catalogo-ideas";

/**
 * Las categorías de lo que un club puede ofrecer, con su pista.
 *
 * La lista sale de `CATEGORIAS_IDEA` y no de los textos, y esto es el
 * arreglo de un fallo real: durante meses aquí había una lista escrita
 * a mano en `home.json` con catorce nombres, mientras el catálogo tenía
 * dieciséis. Faltaban "Digital" y "Retransmisiones", y otras dos
 * estaban escritas distinto ("Familias" por "Familias y socios",
 * "Servicios" por "Lo que necesitas"). Nada fallaba: eran dos listas
 * separadas que se fueron separando más cada vez que se añadía una
 * categoría a una sola de ellas. Leyendo del catálogo eso no puede
 * volver a pasar.
 *
 * La pista de cada categoría también estaba ya escrita ahí: es la misma
 * que ve el club dentro del panel al abrir el catálogo de ideas. Una
 * sola redacción para los dos sitios.
 *
 * CÓMO SE ABRE, que es lo que pidió el usuario:
 *
 *   - Con ratón, basta con pasar por encima (`group-hover`).
 *   - Con teclado, al llegar con el tabulador (`group-focus-within`).
 *   - En el teléfono, tocando. Ahí no hay "pasar por encima", así que
 *     hace falta estado de verdad, y por eso este componente es de
 *     cliente.
 *
 * Es un `<button type="button">` y no un enlace a propósito: el usuario
 * pidió que al tocar NO se cambie de página. Un `<div>` con onClick
 * haría lo mismo con el dedo pero dejaría fuera a quien navega con
 * teclado; un botón lo resuelve sin añadir nada.
 *
 * La pista va en una capa encima de la tarjeta y no debajo del título.
 * Debajo estiraría la tarjeta al abrirse, y como todas las de una fila
 * crecen a la vez, la rejilla entera daría un salto cada vez que el
 * ratón pasa por encima de una.
 */


export function QuePuedesOfrecer() {
  // Cuál está abierta a dedo. Solo una a la vez: en un teléfono, con
  // varias abiertas no se ve ninguna entera.
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {CATEGORIAS_IDEA.map((categoria) => {
        const estaAbierta = abierta === categoria.id;

        return (
          <li key={categoria.id}>
            <button
              type="button"
              onClick={() => setAbierta(estaAbierta ? null : categoria.id)}
              aria-expanded={estaAbierta}
              className="group relative flex h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white px-3 text-center shadow-sm transition-colors hover:border-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion-tinta sm:h-[136px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
                <IconoDeCategoria categoria={categoria.id} className="h-5 w-5" />
              </span>

              <span className="mt-2.5 text-sm font-bold leading-snug text-titular">
                {categoria.etiqueta}
              </span>

              {/* La pista, encima de todo lo anterior. `pointer-events-none`
                  para que el ratón siga viendo el botón de debajo: si la
                  capa capturara el ratón, al aparecer taparía el botón,
                  el `hover` se perdería y la pista parpadearía sin
                  parar. */}
              <span
                className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-navy px-3.5 text-[12.5px] leading-snug text-sobre-color transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
                  estaAbierta ? "opacity-100" : "opacity-0"
                }`}
              >
                {categoria.pista}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
