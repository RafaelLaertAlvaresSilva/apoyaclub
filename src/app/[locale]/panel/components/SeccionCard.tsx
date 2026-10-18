/** Los colores de los apartados del panel (`globals.css`, "UN COLOR POR APARTADO"). */
export type Tono = "azul" | "verde" | "naranja" | "violeta" | "rosa" | "oliva";

export const TONOS: Tono[] = ["azul", "verde", "naranja", "violeta", "rosa", "oliva"];

/**
 * Las clases de un apartado de color, para las tarjetas que no usan
 * `SeccionCard` (listas, avisos, tablas). Sin `tono`, el color sale
 * solo según su posición entre sus hermanas.
 */
export function clasesApartado(tono?: Tono): string {
  return `tonal ${tono ? `tono-${tono}` : "tonal-auto"} rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm`;
}

/**
 * Un apartado del panel: banda de color a la izquierda, cabecera teñida
 * y el título en ese tono. Cada apartado de una página sale de un color
 * distinto, para que se vea de un vistazo dónde empieza y acaba cada
 * cosa.
 *
 * `numero` lo convierte en un paso ("1", "2"...), para los formularios
 * que se rellenan en orden.
 */
export function SeccionCard({
  titulo,
  descripcion,
  tono,
  numero,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  tono?: Tono;
  numero?: number;
  /** Algo a la derecha de la cabecera: un botón de cerrar, por ejemplo. */
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`${clasesApartado(tono)} overflow-hidden`}>
      <div className="flex items-start gap-3 border-b border-(--tono-borde) bg-(--tono-fondo) px-5 py-4 sm:px-6">
        {numero != null && (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--tono-fuerte) text-sm font-bold text-(--tono-fondo)"
          >
            {numero}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-(--tono-tinta)">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-zinc-600">{descripcion}</p>}
        </div>
        {accion}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
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
    <span className="caja-campo-titulo mb-2 block text-[15px] font-bold">{etiqueta}</span>
  );
  const textoAyuda = ayuda ? (
    <span className="mt-2 block text-xs leading-relaxed text-zinc-500">{ayuda}</span>
  ) : null;

  if (grupo) {
    return (
      <div className={CLASES_CAJA_CAMPO}>
        <fieldset className="min-w-0">
          <legend className="caja-campo-titulo mb-2 text-[15px] font-bold">{etiqueta}</legend>
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
 * Y cada caja de su color (`.caja-campo` en `globals.css`): dos campos
 * seguidos nunca salen iguales, así que se ve dónde acaba uno y empieza
 * el siguiente sin tener que leer. El control encima es
 * blanco (`clasesInput`), así que el hueco donde se escribe resalta
 * dentro de la caja. Los dos colores son variables del tema: en el modo
 * oscuro del panel se invierten solos.
 */
export const CLASES_CAJA_CAMPO =
  "tonal tonal-auto caja-campo rounded-xl border border-l-4 border-l-(--tono-fuerte) p-4";

export const clasesInput =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-accion-tinta focus:outline-none focus:ring-1 focus:ring-accion-tinta";

export const clasesTextarea = `${clasesInput} min-h-24 resize-y`;

/**
 * Un paso de un formulario que se rellena en orden (crear una
 * oportunidad): número, título y todo lo de dentro del mismo color. Las
 * cajas de los campos de dentro toman el color del paso en vez de ir
 * cada una del suyo (`.tonal-fijo` en `globals.css`): así se ve qué
 * campos van juntos.
 */
export function Paso({
  numero,
  titulo,
  descripcion,
  tono,
  children,
}: {
  numero: number;
  titulo: string;
  descripcion?: string;
  tono: Tono;
  children: React.ReactNode;
}) {
  return (
    <section className={`${clasesApartado(tono)} tonal-fijo p-4 sm:p-5`}>
      <div className="mb-4 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tono-fuerte) text-base font-bold text-(--tono-fondo)"
        >
          {numero}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-(--tono-tinta)">{titulo}</h3>
          {descripcion && <p className="mt-0.5 text-sm text-zinc-600">{descripcion}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
