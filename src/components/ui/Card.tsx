import type { HTMLAttributes } from "react";

/**
 * Contenedor base del sistema de diseño (Fase 1): esquinas redondeadas,
 * borde suave y sombra ligera, consistentes en toda la interfaz.
 */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm ${className}`} {...props} />;
}
