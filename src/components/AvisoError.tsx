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

export function AvisoExito({ mensaje }: { mensaje?: string | null }) {
  if (!mensaje) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700"
    >
      {mensaje}
    </div>
  );
}
