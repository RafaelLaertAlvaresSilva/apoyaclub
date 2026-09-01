export function SeccionCard({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{etiqueta}</label>
      {children}
      {ayuda && <p className="mt-1 text-xs text-zinc-400">{ayuda}</p>}
    </div>
  );
}

export const clasesInput =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export const clasesTextarea = `${clasesInput} min-h-24 resize-y`;
