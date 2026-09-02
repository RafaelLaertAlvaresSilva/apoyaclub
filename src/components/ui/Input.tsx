import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

/**
 * Campo de texto base del sistema de diseño (Fase 1), con etiqueta y
 * mensaje de error opcionales, ambos enlazados por accesibilidad
 * (aria-invalid / aria-describedby) al campo.
 */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className = "", ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
          error ? "border-red-400" : "border-zinc-300"
        } ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
