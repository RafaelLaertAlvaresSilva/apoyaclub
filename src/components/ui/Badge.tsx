import type { ReactNode } from "react";

type Tono = "neutral" | "teal" | "navy" | "warning" | "danger";

const CLASES_TONO: Record<Tono, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  teal: "bg-brand-teal-light text-brand-teal-dark",
  navy: "bg-brand-navy/10 text-brand-navy",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
};

/**
 * Etiqueta corta del sistema de diseño (Fase 1) para estados (Fase 6:
 * disponible/reservada/cerrada; Fase 8: nueva/vista/en conversación...).
 */
export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tono; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASES_TONO[tone]} ${className}`}>
      {children}
    </span>
  );
}
