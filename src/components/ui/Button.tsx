import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Variante = "primary" | "secondary" | "ghost";
type Tamano = "sm" | "md" | "lg";

const CLASES_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal-dark disabled:pointer-events-none disabled:opacity-50";

const CLASES_VARIANTE: Record<Variante, string> = {
  // Teal oscuro y no el claro: con texto blanco encima, el claro se
  // queda en 2,5:1 de contraste (ver globals.css).
  primary: "bg-brand-teal-dark text-white hover:bg-brand-navy",
  secondary: "bg-brand-navy text-white hover:bg-brand-navy-dark",
  ghost: "text-brand-navy hover:bg-zinc-100",
};

const CLASES_TAMANO: Record<Tamano, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  // El de enviar un formulario. Tres tamaños y se acabó: antes cada
  // botón se escribía a mano y el mismo verde salía en quince altos
  // distintos, que es lo que hace que una web parezca montada a trozos.
  lg: "px-4 py-2.5 text-base",
};

type Props = {
  variant?: Variante;
  size?: Tamano;
  className?: string;
  href?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

/**
 * Botón base del sistema de diseño (Fase 1). Con `href` se renderiza
 * como enlace (mismo estilo visual), para usarlo como llamada a la
 * acción sin tener que envolverlo aparte en un <Link>.
 */
export function Button({ variant = "primary", size = "md", className = "", href, children, ...resto }: Props) {
  const clases = [CLASES_BASE, CLASES_VARIANTE[variant], CLASES_TAMANO[size], className].filter(Boolean).join(" ");

  if (href) {
    return (
      <Link href={href} className={clases}>
        {children}
      </Link>
    );
  }

  return (
    <button className={clases} {...resto}>
      {children}
    </button>
  );
}
