"use client";

import { useEffect } from "react";

/**
 * Que las secciones de la portada entren al bajar: el titular, luego el
 * texto, luego lo demás, separados 70 ms.
 *
 * No envuelve nada a propósito. Las secciones son de servidor y siguen
 * pintándose enteras; esto solo, ya en el navegador, marca sus piezas y
 * las enseña cuando la sección asoma. Si el JavaScript no llega, no se
 * esconde nada.
 *
 * Se repite cada vez que una sección entra DESDE ABAJO, es decir, cada vez
 * que se baja hasta ella: cuando la sección vuelve a quedar por debajo de
 * la pantalla (al subir), sus piezas se esconden sin animación y quedan
 * listas para la próxima bajada. Lo que queda por ENCIMA de la pantalla
 * no se toca, así que al subir para releer nada desaparece ni parpadea.
 *
 * Las secciones que ya se ven al cargar empiezan visibles (sin animar la
 * primera vez, para que no parpadee lo primero que se ve) y a partir de
 * ahí se comportan como las demás. El escalonado va en `--retraso` y la
 * animación en `globals.css` ("LA ENTRADA AL BAJAR").
 */
const PIEZAS = "h2, h3, p, li, img, dl, a";

export function EntradaAlBajar() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const secciones = Array.from(document.querySelectorAll<HTMLElement>("#contenido > section"));

    // Las piezas de cada sección, marcadas una vez con `data-entra`.
    const piezasDe = (seccion: Element) => seccion.querySelectorAll<HTMLElement>("[data-entra]");

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            // Solo las que estaban escondidas: las que ya se ven no se
            // vuelven a animar.
            piezasDe(entrada.target).forEach((pieza) => {
              if (pieza.classList.contains("entra")) pieza.classList.add("entra-ya");
            });
          } else if (entrada.boundingClientRect.top > 0) {
            // Ha vuelto a quedar por debajo de la pantalla: se esconde,
            // sin animación, lista para la próxima bajada.
            piezasDe(entrada.target).forEach((pieza) => {
              pieza.classList.add("entra");
              pieza.classList.remove("entra-ya");
            });
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    for (const seccion of secciones) {
      const yaSeVe = seccion.getBoundingClientRect().top < window.innerHeight;
      const todas = Array.from(seccion.querySelectorAll<HTMLElement>(PIEZAS));
      // Solo la pieza de fuera: si se mueven una tarjeta y su párrafo a
      // la vez, el párrafo sube el doble.
      const piezas = todas.filter((pieza) => !todas.some((otra) => otra !== pieza && otra.contains(pieza)));
      piezas.forEach((pieza, orden) => {
        pieza.dataset.entra = "";
        pieza.style.setProperty("--retraso", `${Math.min(orden, 8) * 70}ms`);
        // Las que ya se ven al cargar se quedan como están: no se
        // esconden hasta que su sección salga por abajo.
        if (!yaSeVe) pieza.classList.add("entra");
      });
      observador.observe(seccion);
    }

    return () => observador.disconnect();
  }, []);

  return null;
}
