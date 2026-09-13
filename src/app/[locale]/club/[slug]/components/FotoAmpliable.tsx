"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Ver una foto entera, sin el recorte con el que se enseña en la página.
 *
 * La portada se recorta a una franja apaisada y las fotos de la galería
 * a un cuadrado. En un ordenador se intuye lo que falta; en un teléfono
 * en vertical, de una foto de equipo se ve una tira de camisetas y poco
 * más. El club sube su mejor foto y nadie llega a verla.
 *
 * Se usa `<dialog>` y no un div a mano porque trae de serie lo que hace
 * falta: se cierra con Escape, atrapa el foco dentro y deja el resto de
 * la página fuera del alcance del lector de pantalla.
 *
 * La foto grande no se descarga hasta que alguien la abre: quien solo
 * pasa por la página no paga el peso de una imagen a pantalla completa.
 */
export function FotoAmpliable({
  src,
  alt,
  textoAbrir,
  textoCerrar,
  conEtiqueta = false,
}: {
  src: string;
  alt: string;
  textoAbrir: string;
  textoCerrar: string;
  /** Enseña el rótulo "Ver foto completa" encima de la imagen. Solo en
   * la portada: en una galería de seis fotos, seis rótulos tapan justo
   * lo que se quiere mirar. */
  conEtiqueta?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierta, setAbierta] = useState(false);

  // Con el diálogo abierto, la página de detrás no se mueve. Sin esto,
  // arrastrar el dedo sobre la foto hace scroll en lo de abajo y da la
  // sensación de que algo va mal.
  useEffect(() => {
    if (!abierta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierta]);

  const abrir = () => {
    setAbierta(true);
    dialogo.current?.showModal();
  };

  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-label={textoAbrir}
        className="absolute inset-0 z-10 flex cursor-zoom-in items-end justify-end p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {conEtiqueta && (
          <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 3h5v2H5v3H3V3Zm9 0h5v5h-2V5h-3V3ZM3 12h2v3h3v2H3v-5Zm12 0h2v5h-5v-2h3v-3Z" />
            </svg>
            {textoAbrir}
          </span>
        )}
      </button>

      <dialog
        ref={dialogo}
        onClose={() => setAbierta(false)}
        // Pinchar fuera de la foto cierra. El clic sobre el fondo llega
        // con `target` igual al propio diálogo; sobre la foto, no.
        onClick={(evento) => {
          if (evento.target === dialogo.current) cerrar();
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/90"
      >
        {abierta && (
          <div className="flex h-full w-full items-center justify-center p-4">
            <div className="relative h-full w-full">
              {/* La foto entera es el objetivo de todo esto: si no cabe
                  en la pantalla se reduce, pero no se recorta nunca. */}
              <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
            </div>

            <button
              type="button"
              onClick={cerrar}
              aria-label={textoCerrar}
              className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M6.3 4.9 4.9 6.3 8.6 10l-3.7 3.7 1.4 1.4L10 11.4l3.7 3.7 1.4-1.4L11.4 10l3.7-3.7-1.4-1.4L10 8.6 6.3 4.9Z" />
              </svg>
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
