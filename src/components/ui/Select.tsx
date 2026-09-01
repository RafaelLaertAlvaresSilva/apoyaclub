import { forwardRef, type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

/**
 * Desplegable base del sistema de diseño (Fase 1), con el mismo
 * tratamiento de etiqueta/error accesible que `Input`.
 */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, id, className = "", children, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
          error ? "border-red-400" : "border-zinc-300"
        } ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
