"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Botón fijo abajo, solo en móvil.
 *
 * En una pantalla de teléfono la portada es larga y el botón de
 * "Prueba 1 mes gratis" se queda arriba del todo: quien llega a la
 * sección de precio convencido tiene que volver a subir. Esto lo
 * resuelve sin tapar nada, porque `main` reserva el hueco.
 *
 * Dos condiciones para que aparezca, y las dos importan:
 *
 *   - Hay que haber bajado de la primera pantalla. Un botón fijo desde
 *     el primer segundo, con el mismo botón grande justo encima, es
 *     insistir antes de haber dicho nada.
 *   - El banner de cookies tiene que estar ya contestado. Los dos van
 *     pegados abajo y se solaparían; manda el de cookies, que es una
 *     obligación legal y no una llamada a la acción.
 */

const CLAVE_COOKIES = "apoyaclub_cookie_consent";
const ALTURA_PARA_APARECER = 560;

function suscribirse(alCambiar: () => void) {
  window.addEventListener("scroll", alCambiar, { passive: true });
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener("scroll", alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function debeVerse(): boolean {
  if (window.scrollY < ALTURA_PARA_APARECER) return false;
  try {
    return window.localStorage.getItem(CLAVE_COOKIES) !== null;
  } catch {
    // Navegador con el almacenamiento bloqueado: el banner de cookies
    // se queda puesto, así que este botón no sale. Mejor eso que dos
    // barras encima.
    return false;
  }
}

/** En el servidor no hay ventana: el HTML inicial sale sin el botón. */
function ocultoEnElServidor(): boolean {
  return false;
}

export function CtaFijoMovil({ texto, condiciones }: { texto: string; condiciones: string }) {
  const visible = useSyncExternalStore(suscribirse, debeVerse, ocultoEnElServidor);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
      <Link
        href="/registro-club"
        className="flex w-full items-center justify-center rounded-full bg-brand-teal-dark px-6 py-3.5 text-base font-bold text-white"
      >
        {texto}
      </Link>
      <p className="mt-1.5 text-center text-[11px] text-zinc-500">{condiciones}</p>
    </div>
  );
}
