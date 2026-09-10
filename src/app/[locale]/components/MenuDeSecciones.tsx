"use client";

import { useEffect, useState } from "react";

/**
 * Índice de la portada: una barra con las secciones, pegada bajo la
 * cabecera, que marca en cuál estás.
 *
 * La portada es larga, y tiene que serlo — un club que se plantea pagar
 * necesita ver qué recibe. Lo que no puede es no tener mapa: sin él,
 * quien solo quiere el precio se pierde por el camino y quien vuelve una
 * segunda vez tiene que volver a bajar entero.
 *
 * Dos decisiones:
 *
 *   - Seis entradas, no catorce. Un índice con todas las secciones
 *     vuelve a ser el problema que intenta resolver. Están las que
 *     alguien busca a propósito; las demás se leen bajando.
 *   - La altura de la cabecera se mide en el navegador en vez de
 *     escribirla aquí a mano. Escrita a mano, el día que el logo cambie
 *     de tamaño esta barra se solapa con la cabecera y nadie se entera
 *     hasta que lo ve un club.
 */

const SECCIONES = [
  { id: "como-funciona", etiqueta: "Cómo funciona" },
  { id: "clubes", etiqueta: "Qué puedes ofrecer" },
  { id: "oportunidades", etiqueta: "Oportunidades" },
  { id: "empresas", etiqueta: "Para empresas" },
  { id: "herramientas", etiqueta: "Herramientas" },
  { id: "precio", etiqueta: "Precio" },
] as const;

export function MenuDeSecciones() {
  const [alturaCabecera, setAlturaCabecera] = useState(0);
  const [activa, setActiva] = useState<string | null>(null);

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

    const nodos = SECCIONES.map(({ id }) => document.getElementById(id)).filter(
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
  }, []);

  return (
    <nav
      aria-label="Secciones de la página"
      style={{ top: alturaCabecera }}
      className="sticky z-30 border-b border-zinc-200 bg-white"
    >
      {/* Se desplaza en horizontal en móvil en vez de partirse en dos
          filas: una barra de índice de dos alturas se come la pantalla
          justo en el sitio donde menos sobra. */}
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECCIONES.map((seccion) => (
          <a
            key={seccion.id}
            href={`#${seccion.id}`}
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
    </nav>
  );
}
