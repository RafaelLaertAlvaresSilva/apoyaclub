export function AvisoError({ mensaje }: { mensaje?: string | null }) {
  if (!mensaje) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {mensaje}
    </div>
  );
}

/**
 * "Guardado." y demás avisos de que algo ha ido bien: en todo el panel
 * con el mismo aspecto, su ✓ y una entrada suave.
 */
export function AvisoExito({ mensaje }: { mensaje?: string | null }) {
  if (!mensaje) return null;

  return (
    <div
      role="status"
      className="aviso-aparece flex items-center gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800"
    >
      <span
        aria-hidden="true"
        className="flex size-5 flex-none items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-sobre-color"
      >
        ✓
      </span>
      {mensaje}
    </div>
  );
}
