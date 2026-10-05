"use client";

import { useState } from "react";
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

const ICONO_DE_CATEGORIA: Record<string, React.ReactNode> = {
  equipos: (
    <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
  ),
  equipaciones: (
    <path d="M8.5 4L5 6l1.5 3.5L8 9v11h8V9l1.5.5L19 6l-3.5-2a3.5 3.5 0 01-7 0z" />
  ),
  instalaciones: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="1.5" />
      <path d="M12 7v12M3 11h3v4H3M21 11h-3v4h3" />
    </>
  ),
  intervalo: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.5M9.5 2.5h5" />
    </>
  ),
  redes: (
    <>
      <circle cx="17" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="18.5" r="2.5" />
      <path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6" />
    </>
  ),
  cantera: (
    <>
      <path d="M12 21c0-5 2.5-8 7-8 0 5-2.5 8-7 8z" />
      <path d="M12 21c0-5-2.5-8-7-8 0 5 2.5 8 7 8zM12 21v-6" />
    </>
  ),
  jugadores: (
    <>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5.5 20.5a6.5 6.5 0 0113 0" />
    </>
  ),
  eventos: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  torneos: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 008 8M16 5.5h2.5A2.5 2.5 0 0116 8M12 13v3.5M8.5 20h7" />
    </>
  ),
  contenido: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" />
    </>
  ),
  digital: (
    <>
      <rect x="2.5" y="5" width="19" height="12" rx="2" />
      <path d="M8.5 21h7M12 17v4" />
    </>
  ),
  retransmisiones: (
    <>
      <rect x="2.5" y="7" width="12" height="10" rx="2" />
      <path d="M14.5 11l6-3v8l-6-3z" />
    </>
  ),
  familias: (
    <>
      <path d="M12 20s-6.5-3.8-6.5-8.5A3.5 3.5 0 0112 9.4a3.5 3.5 0 016.5 2.1C18.5 16.2 12 20 12 20z" />
    </>
  ),
  tienda: (
    <>
      <path d="M5.5 8h13l1 12.5h-15z" />
      <path d="M9 10.5V7a3 3 0 016 0v3.5" />
    </>
  ),
  "visibilidad-local": (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  servicios: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 004.8 4.8l-8 8a2.4 2.4 0 01-3.4-3.4l8-8z" />
      <path d="M14.5 6.5L17 4M6 20l-2 0 0-2" />
    </>
  ),
};

const ICONO_GENERICO = <circle cx="12" cy="12" r="8" />;

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
              className="group relative flex h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white px-3 text-center shadow-sm transition-colors hover:border-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal-dark sm:h-[136px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {ICONO_DE_CATEGORIA[categoria.id] ?? ICONO_GENERICO}
                </svg>
              </span>

              <span className="mt-2.5 text-sm font-bold leading-snug text-brand-navy">
                {categoria.etiqueta}
              </span>

              {/* La pista, encima de todo lo anterior. `pointer-events-none`
                  para que el ratón siga viendo el botón de debajo: si la
                  capa capturara el ratón, al aparecer taparía el botón,
                  el `hover` se perdería y la pista parpadearía sin
                  parar. */}
              <span
                className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-navy px-3.5 text-[12.5px] leading-snug text-white transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
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
