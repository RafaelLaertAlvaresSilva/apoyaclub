import { CAMPO_TRAMPA } from "@/lib/rate-limit";

/**
 * Campo trampa (honeypot) para los formularios públicos (Fase 15).
 * Invisible y fuera del orden de tabulación, así que ni se ve ni se
 * puede rellenar sin querer; los bots que rellenan todos los campos de
 * un formulario sí caen. Ver `lib/rate-limit.ts`.
 */
export function CampoTrampa() {
  return (
    <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={CAMPO_TRAMPA}>No rellenes este campo</label>
      <input id={CAMPO_TRAMPA} name={CAMPO_TRAMPA} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
