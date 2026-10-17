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
  const textoEtiqueta = (
    <span className="mb-2 block text-[15px] font-bold text-titular">{etiqueta}</span>
  );
  const textoAyuda = ayuda ? (
    <span className="mt-2 block text-xs leading-relaxed text-zinc-500">{ayuda}</span>
  ) : null;

  if (grupo) {
    return (
      <div className={CLASES_CAJA_CAMPO}>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-[15px] font-bold text-titular">{etiqueta}</legend>
          {children}
          {textoAyuda}
        </fieldset>
      </div>
    );
  }

  return (
    <label className={`block ${CLASES_CAJA_CAMPO}`}>
      {textoEtiqueta}
      {children}
      {textoAyuda}
    </label>
  );
}

/**
 * CADA CAMPO EN SU CAJA.
 *
 * Antes la etiqueta, el control y la ayuda de un campo iban sueltos,
 * con 16 px hasta el siguiente: en un formulario largo (crear una
 * oportunidad tiene veinte campos) la ayuda gris de uno se leía como la
 * etiqueta del de abajo y no se sabía dónde acababa cada cosa. Ahora
 * cada campo es un bloque con fondo y borde, y el título del campo va
 * más grande, en negrita y en el azul de los titulares, para que se
 * distinga de un vistazo de la ayuda gris de debajo.
 *
 * El fondo es el gris de lienzo (`zinc-50`) y el control encima es
 * blanco (`clasesInput`), así que el hueco donde se escribe resalta
 * dentro de la caja. Los dos colores son variables del tema: en el modo
 * oscuro del panel se invierten solos.
 */
const CLASES_CAJA_CAMPO = "rounded-xl border border-zinc-200 bg-zinc-50 p-4";

export const clasesInput =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-accion-tinta focus:outline-none focus:ring-1 focus:ring-accion-tinta";

export const clasesTextarea = `${clasesInput} min-h-24 resize-y`;
