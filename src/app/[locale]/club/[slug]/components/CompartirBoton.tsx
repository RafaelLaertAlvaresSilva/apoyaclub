"use client";

import { useState } from "react";

/** Botón de "Compartir enlace": usa el share nativo del móvil si existe
 * (así comparte directo a WhatsApp, etc.) y si no, copia la URL. */
export function CompartirBoton({ url, titulo }: { url: string; titulo: string }) {
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function compartir() {
    // Se re-tipa `share` como opcional a propósito: en el tipo estándar
    // de Navigator es obligatorio, así que TypeScript trataría el resto
    // de la función (el navegador sin Web Share API) como código
    // inalcanzable si no se hiciera así.
    const nav =
      typeof navigator === "undefined"
        ? null
        : (navigator as Navigator & { share?: (data?: ShareData) => Promise<void> });

    if (nav?.share) {
      try {
        await nav.share({ title: titulo, url });
        return;
      } catch {
        // El usuario cerró el panel de compartir: no hacemos nada más.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setMensaje("¡Enlace copiado!");
    } catch {
      setMensaje(url);
    } finally {
      setTimeout(() => setMensaje(null), 2500);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={compartir}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        <span aria-hidden="true">🔗</span>
        Compartir enlace
      </button>
      {mensaje && (
        <span className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg">
          {mensaje}
        </span>
      )}
    </div>
  );
}
