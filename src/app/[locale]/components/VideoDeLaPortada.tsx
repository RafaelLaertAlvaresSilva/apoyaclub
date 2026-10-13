"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El vídeo de presentación, al lado del mensaje de la portada.
 *
 * DENTRO DE UN MARCO DE TELÉFONO, y no suelto. El vídeo es vertical
 * (9:16), que es el formato de un reel. Puesto a secas en media
 * columna de un ordenador se lee como un vídeo mal encajado; dentro de
 * un teléfono se lee como lo que es. El marco además lo justifica: a
 * nadie le extraña que un teléfono sea alto.
 *
 * Y es estrecho a propósito. A 460 px de ancho —media columna— un 9:16
 * mide 818 px de alto, y el héroe pasaría de 553 px a 870: en un
 * portátil, los botones "Soy un club" y "Soy una empresa" se quedarían
 * fuera de la pantalla, que es lo contrario de lo que este cambio
 * busca. A 300 px el vídeo mide 533 y cabe al lado del texto.
 *
 * ARRANCA SOLO, SIN SONIDO Y EN BUCLE, que es como funciona un vídeo
 * de cabecera: ningún navegador deja que algo suene sin que lo pidas, y
 * un vídeo parado con un triángulo encima no lo pulsa casi nadie. El
 * botón de sonido está para quien lo quiera.
 */
export function VideoDeLaPortada({
  src,
  poster,
  etiqueta,
}: {
  src: string;
  poster: string;
  etiqueta: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [conSonido, setConSonido] = useState(false);

  /**
   * Quien ha pedido en su sistema que no se muevan las cosas, no ve
   * un bucle: ve la imagen fija y un botón. No es un adorno de
   * accesibilidad — a quien le marea el movimiento, un vídeo en bucle
   * al lado del texto le impide leerlo.
   *
   * Si está parado o no se lee del propio elemento (`paused`) y no de
   * un estado aparte: el navegador también lo para él solo —una
   * pestaña de fondo, batería baja—, y entonces un estado nuestro
   * estaría diciendo que corre cuando no corre.
   */
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.current?.pause();
  }, []);

  function alternarSonido() {
    const elemento = video.current;
    if (!elemento) return;

    elemento.muted = conSonido;
    setConSonido(!conSonido);

    // Pedir sonido es pedir verlo: si estaba parado, arranca.
    if (elemento.paused) void elemento.play();
  }

  return (
    <div className="mx-auto w-[240px] flex-none sm:w-[280px] lg:w-[300px]">
      <div className="relative overflow-hidden rounded-[2rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-brand-navy/25">
        {/* El altavoz. Dos píxeles de nada, pero sin él el marco es un
            rectángulo negro y no un teléfono. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1.5 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-zinc-700"
        />

        <video
          ref={video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={etiqueta}
          className="block aspect-[478/850] h-auto w-full rounded-[1.5rem] bg-zinc-900 object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>

        <button
          type="button"
          onClick={alternarSonido}
          aria-pressed={conSonido}
          className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="sr-only">{conSonido ? "Quitar el sonido" : "Poner el sonido"}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 9.5v5a1 1 0 001 1h2.5l4 3.5v-14l-4 3.5H5a1 1 0 00-1 1z" />
            {conSonido ? (
              <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
            ) : (
              <path d="M16 10l4 4M20 10l-4 4" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
