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

/**
 * Etiqueta + control de un formulario del panel.
 *
 * La etiqueta envuelve al control en vez de ir suelta a su lado: hasta
 * ahora era un `<label>` hermano y sin `htmlFor`, así que ni un lector de
 * pantalla sabía a qué campo pertenecía ni se podía pulsar el texto para
 * enfocar el campo. Envolviéndolo, las dos cosas funcionan sin tener que
 * inventar un `id` en cada uno de los cuarenta campos del panel.
 *
 * Cuando dentro hay varios controles (un grupo de casillas, un rango de
 * dos números), una etiqueta única sería ambigua: ahí se usa
 * `<fieldset>` + `<legend>`, que es lo que describe a un grupo.
 */
export function Campo({
  etiqueta,
  ayuda,
  grupo = false,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  /** true cuando dentro hay más de un control (casillas, rangos). */
  grupo?: boolean;
  children: React.ReactNode;
}) {
  const textoEtiqueta = <span className="mb-1 block text-sm font-medium text-zinc-700">{etiqueta}</span>;
  const textoAyuda = ayuda ? <span className="mt-1 block text-xs text-zinc-500">{ayuda}</span> : null;

  if (grupo) {
    return (
      <fieldset className="min-w-0">
        <legend className="mb-1 text-sm font-medium text-zinc-700">{etiqueta}</legend>
        {children}
        {textoAyuda}
      </fieldset>
    );
  }

  return (
    <label className="block">
      {textoEtiqueta}
      {children}
      {textoAyuda}
    </label>
  );
}

export const clasesInput =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark";

export const clasesTextarea = `${clasesInput} min-h-24 resize-y`;
