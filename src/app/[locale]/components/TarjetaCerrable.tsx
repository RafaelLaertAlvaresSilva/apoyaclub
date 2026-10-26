"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

/**
 * Envuelve la tarjeta de los 6 meses con una X para cerrarla.
 *
 * Al cerrarla se recuerda en este navegador, para que no vuelva a salir
 * en cada visita. Si el navegador no deja guardar (modo privado), se
 * cierra igual y solo vuelve al recargar.
 */
const CLAVE = "apoyaclub-tarjeta-6meses-cerrada";

function cerradaAntes(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) === "1";
  } catch {
    // Sin almacenamiento: se enseña la tarjeta.
    return false;
  }
}

function escuchar(aviso: () => void) {
  window.addEventListener("storage", aviso);
  return () => window.removeEventListener("storage", aviso);
}

export function TarjetaCerrable({ etiquetaCerrar, children }: { etiquetaCerrar: string; children: ReactNode }) {
  // En el servidor no hay almacenamiento: la tarjeta sale, y en el
  // navegador se esconde si ya se había cerrado antes.
  const guardada = useSyncExternalStore(escuchar, cerradaAntes, () => false);
  const [cerradaAhora, setCerradaAhora] = useState(false);

  if (guardada || cerradaAhora) return null;

  function cerrar() {
    setCerradaAhora(true);
    try {
      window.localStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento: se cierra solo en esta visita.
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      {children}
      <button
        type="button"
        onClick={cerrar}
        aria-label={etiquetaCerrar}
        title={etiquetaCerrar}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-titular shadow-md transition-colors hover:bg-white focus-visible:outline-accion-tinta"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
