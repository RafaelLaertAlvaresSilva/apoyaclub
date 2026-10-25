"use client";

import { useEffect } from "react";

/**
 * Que las secciones de la portada entren al bajar: el titular, luego el
 * texto, luego lo demás, separados 70 ms.
 *
 * No envuelve nada a propósito. Las secciones son de servidor y siguen
 * pintándose enteras; esto solo, ya en el navegador, esconde las piezas
 * de las secciones que aún no se ven y las enseña cuando asoman. Si el
 * JavaScript no llega, no se esconde nada. Las que ya están en pantalla
 * al cargar no se tocan, para que no parpadee lo primero que se ve.
 */
const PIEZAS = "h2, h3, p, li, img, dl, a";

export function EntradaAlBajar() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const secciones = Array.from(document.querySelectorAll<HTMLElement>("#contenido > section")).filter(
      (seccion) => seccion.getBoundingClientRect().top > window.innerHeight,
    );

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.querySelectorAll<HTMLElement>(".entra").forEach((pieza) => pieza.classList.add("entra-ya"));
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    for (const seccion of secciones) {
      const todas = Array.from(seccion.querySelectorAll<HTMLElement>(PIEZAS));
      // Solo la pieza de fuera: si se mueven una tarjeta y su párrafo a
      // la vez, el párrafo sube el doble.
      const piezas = todas.filter((pieza) => !todas.some((otra) => otra !== pieza && otra.contains(pieza)));
      piezas.forEach((pieza, orden) => {
        pieza.classList.add("entra");
        pieza.style.transitionDelay = `${Math.min(orden, 8) * 70}ms`;
      });
      observador.observe(seccion);
    }

    return () => observador.disconnect();
  }, []);

  return null;
}
