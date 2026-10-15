"use client";

import { useEffect } from "react";
import { aplicarTema, CLAVE_DEL_TEMA, olvidarTema } from "./GuionDelTema";

/**
 * El botón de encender y apagar el modo oscuro.
 *
 * Solo en el panel: la página pública del club es el escaparate que ve
 * una empresa, y esa se queda clara siempre.
 *
 * NO GUARDA EL TEMA EN UN ESTADO DE REACT, y esa es la decisión que
 * hace que esto funcione bien. El servidor no sabe qué tiene guardado
 * este navegador ni qué ajuste tiene el móvil, así que cualquier estado
 * empezaría valiendo "claro" y se corregiría después de cargar: el
 * botón enseñaría "Modo oscuro" durante medio segundo en una pantalla
 * que ya está oscura.
 *
 * En vez de eso se pintan LOS DOS rótulos, el de encender y el de
 * apagar, y el CSS esconde el que no toca mirando el mismo atributo que
 * ya dejó escrito el guion antes de pintar. Resultado: el rótulo
 * correcto viene ya en el HTML, no hay parpadeo, y no hay nada que
 * sincronizar entre el servidor y el navegador.
 */
export function InterruptorDeTema() {
  /**
   * Si el club NO ha elegido a mano, el panel sigue al sistema en vivo:
   * un móvil que se pone oscuro solo al anochecer cambia el panel sin
   * recargar. En cuanto elige, su elección manda y esto se calla.
   */
  useEffect(() => {
    // Por si se ha llegado aquí desde otra página sin recargar: ahí el
    // guion de antes del pintado no se ejecuta.
    aplicarTema();

    const medio = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiarElSistema = (evento: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(CLAVE_DEL_TEMA)) return;
      } catch {
        return;
      }
      document.documentElement.dataset.temaPanel = evento.matches
        ? "oscuro"
        : "claro";
    };
    medio.addEventListener("change", alCambiarElSistema);
    return () => {
      medio.removeEventListener("change", alCambiarElSistema);
      // Al salir del panel, que la portada no herede el fondo oscuro.
      olvidarTema();
    };
  }, []);

  function alternar() {
    const raiz = document.documentElement;
    const nuevo = raiz.dataset.temaPanel === "oscuro" ? "claro" : "oscuro";
    raiz.dataset.temaPanel = nuevo;
    // Que falle guardar no puede impedir el cambio: en navegación
    // privada el tema cambia igual, solo que no se recuerda.
    try {
      localStorage.setItem(CLAVE_DEL_TEMA, nuevo);
    } catch {
      /* sin memoria, pero funcionando */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accion-tinta hover:text-accion-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion-tinta"
    >
      <span className="solo-tema-claro inline-flex items-center gap-2">
        <IconoLuna />
        <span className="hidden sm:inline">Modo oscuro</span>
      </span>
      <span className="solo-tema-oscuro inline-flex items-center gap-2">
        <IconoSol />
        <span className="hidden sm:inline">Modo claro</span>
      </span>
    </button>
  );
}

/**
 * Dibujados, no caracteres: ☀ y ☾ salen de un tamaño distinto en cada
 * sistema y en Windows a veces salen como un cuadrado vacío.
 */
function IconoLuna() {
  return (
    <Lienzo>
      <path d="M20 13.5A8 8 0 1110.5 4a6.5 6.5 0 009.5 9.5z" />
    </Lienzo>
  );
}

function IconoSol() {
  return (
    <Lienzo>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </Lienzo>
  );
}

function Lienzo({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 flex-none"
    >
      {children}
    </svg>
  );
}
