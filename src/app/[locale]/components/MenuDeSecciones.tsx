"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Índice de una página larga: una barra con sus secciones, pegada bajo
 * la cabecera, que marca en cuál estás.
 *
 * La usan la portada y las dos páginas de detalle —clubes y empresas—,
 * y cada una pasa su lista. Quien solo quiere el precio no debería
 * tener que bajar la página entera para encontrarlo, y quien vuelve una
 * segunda vez tampoco.
 *
 * Dos decisiones:
 *
 *   - Pocas entradas, no todas. Un índice con todas las secciones
 *     vuelve a ser el problema que intenta resolver. Están las que
 *     alguien busca a propósito; las demás se leen bajando.
 *   - La altura de la cabecera se mide en el navegador en vez de
 *     escribirla aquí a mano. Escrita a mano, el día que el logo cambie
 *     de tamaño esta barra se solapa con la cabecera y nadie se entera
 *     hasta que lo ve un club.
 */

export type SeccionDelMenu = { id: string; etiqueta: string };

/** Las de la portada. Desde que la portada es corta caben todas; las
 * páginas de club y de empresa pasan las suyas. */
const SECCIONES_PORTADA: SeccionDelMenu[] = [
  { id: "para-quien", etiqueta: "Para quién es" },
  { id: "como-funciona", etiqueta: "Cómo funciona" },
  { id: "precio", etiqueta: "Precio" },
  { id: "faq", etiqueta: "Preguntas" },
  { id: "contacto", etiqueta: "Contacto" },
];

export function MenuDeSecciones({
  secciones = SECCIONES_PORTADA,
}: {
  secciones?: SeccionDelMenu[];
}) {
  const [alturaCabecera, setAlturaCabecera] = useState(0);
  const [activa, setActiva] = useState<string | null>(null);
  const barra = useRef<HTMLDivElement>(null);

  // La pestaña de la sección en la que estás se trae a la vista sola.
  // `block: "nearest"` es lo que impide que al hacerlo se mueva también
  // la página entera hacia arriba.
  useEffect(() => {
    if (!activa || !barra.current) return;

    const pestana = barra.current.querySelector(`[data-seccion="${activa}"]`);
    pestana?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [activa]);

  // La cabecera es sticky y esta barra va justo debajo. Se mide en vez
  // de fijarla: el logo cambia de alto entre móvil y escritorio.
  useEffect(() => {
    const cabecera = document.querySelector("header");
    if (!cabecera) return;

    const medir = () => setAlturaCabecera(cabecera.getBoundingClientRect().height);
    medir();

    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(cabecera);
    return () => observador.disconnect();
  }, []);

  // Qué sección se está mirando. El margen superior descuenta las dos
  // barras pegadas arriba; si no, se marcaría como activa la sección
  // que está tapada por ellas.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const nodos = secciones.map(({ id }) => document.getElementById(id)).filter(
      (nodo): nodo is HTMLElement => nodo !== null,
    );
    if (nodos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) setActiva(visible.target.id);
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 },
    );

    for (const nodo of nodos) observador.observe(nodo);
    return () => observador.disconnect();
  }, [secciones]);

  return (
    <nav
      aria-label="Secciones de la página"
      style={{ top: alturaCabecera }}
      className="sticky z-30 border-b border-zinc-200 bg-white"
    >
      {/* Se desplaza en horizontal en móvil en vez de partirse en dos
          filas: una barra de índice de dos alturas se come la pantalla
          justo en el sitio donde menos sobra.
          *
          * Con dos añadidos, porque en un teléfono solo caben tres o
          * cuatro y las últimas quedaban fuera de pantalla detrás de un
          * gesto que casi nadie hace: un degradado en el borde derecho
          * que avisa de que hay más, y la sección en la que estás, que
          * se trae sola a la vista al ir bajando. */}
      <div className="relative">
        <div
          ref={barra}
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {secciones.map((seccion) => (
          <a
            key={seccion.id}
            href={`#${seccion.id}`}
            data-seccion={seccion.id}
            aria-current={activa === seccion.id ? "true" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activa === seccion.id
                ? "bg-brand-navy text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-brand-navy"
            }`}
          >
            {seccion.etiqueta}
          </a>
        ))}
        </div>

        {/* El aviso de "hay más a la derecha". No se puede pulsar y solo
            está en el móvil, que es donde la fila no cabe. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:hidden"
        />
      </div>
    </nav>
  );
}
