"use client";

import { useEffect } from "react";

/**
 * Ventana modal base del sistema de diseño (Fase 1): cierra con Escape
 * o al hacer clic fuera, y marca el diálogo como tal para lectores de
 * pantalla (role="dialog" + aria-modal).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function alPulsarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", alPulsarTecla);
    return () => document.removeEventListener("keydown", alPulsarTecla);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        {title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
