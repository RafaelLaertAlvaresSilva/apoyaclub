type Seccion = { id: string; etiqueta: string };

/**
 * Las dos secciones que llevan a una acción, y por eso van delante de
 * todo y en color: "Oportunidades disponibles" es lo que el club vende,
 * "Servicios que buscamos" es lo que el club necesita. El resto de la
 * ficha (historia, cantera, instalaciones…) es lo que convence, pero
 * nadie escribe a un club por haber leído su palmarés.
 */
const DESTACADAS = ["oportunidades", "servicios"] as const;

/**
 * Ojo con estas clases: ninguna lleva `inline-flex` dentro.
 *
 * Lo llevaban, y por eso el desplegable del móvil no servía de nada.
 * Una de estas pastillas se esconde en el móvil con `hidden`, y
 * `hidden` e `inline-flex` son las dos la misma propiedad de CSS
 * (`display`). Con las dos puestas a la vez gana la que el navegador
 * lea la última, que resultó ser `inline-flex`: en el teléfono salían
 * todas las secciones sueltas Y además el desplegable con las mismas
 * dentro. El menú entero, dos veces.
 *
 * Ahora el `display` se pone fuera, en cada sitio donde se usan, y no
 * hay forma de que se peleen.
 */
const CLASES_PASTILLA = "items-center rounded-full px-4 py-2 text-sm transition-colors";
const CLASES_DESTACADA = `inline-flex ${CLASES_PASTILLA} bg-teal-700 font-semibold text-white hover:bg-teal-800`;
const CLASES_NORMAL = `${CLASES_PASTILLA} border border-zinc-300 bg-white font-medium text-zinc-700 hover:border-teal-600 hover:text-teal-700`;

/**
 * Índice de la ficha del club.
 *
 * Antes era una fila con desplazamiento lateral. En el ordenador
 * sobraba —había sitio de resto para ponerlos todos— y en el móvil era
 * peor que sobrar: las secciones que no cabían quedaban escondidas
 * detrás de un gesto que nadie hace, así que en la práctica no existían.
 *
 * Ahora en el ordenador se ven todas, en varias filas si hace falta. En
 * el móvil quedan fijas las dos que llevan a una acción y las demás se
 * recogen en un desplegable. Es un `<details>` del propio navegador: sin
 * JavaScript, funciona igual con la pestaña recién abierta.
 */
export function IndiceDeSecciones({ secciones }: { secciones: Seccion[] }) {
  const esDestacada = (id: string) => (DESTACADAS as readonly string[]).includes(id);

  const destacadas = secciones.filter((seccion) => esDestacada(seccion.id));
  const resto = secciones.filter((seccion) => !esDestacada(seccion.id));

  if (secciones.length < 2) return null;

  return (
    <nav aria-label="Secciones de la ficha" className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
      <div className="flex flex-wrap gap-2">
        {destacadas.map((seccion) => (
          <a key={seccion.id} href={`#${seccion.id}`} className={CLASES_DESTACADA}>
            {seccion.etiqueta}
          </a>
        ))}

        {/* En el móvil estas mismas van dentro del desplegable de abajo:
            aquí se esconden para no repetirlas. `CLASES_NORMAL` ya no
            trae `display`, así que `hidden` manda sin discusión. */}
        {resto.map((seccion) => (
          <a
            key={seccion.id}
            href={`#${seccion.id}`}
            className={`hidden sm:inline-flex ${CLASES_NORMAL}`}
          >
            {seccion.etiqueta}
          </a>
        ))}
      </div>

      {resto.length > 0 && (
        <details className="group mt-2 sm:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 [&::-webkit-details-marker]:hidden">
            Ver todo el club
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </summary>

          <div className="mt-2 flex flex-wrap gap-2">
            {resto.map((seccion) => (
              <a
                key={seccion.id}
                href={`#${seccion.id}`}
                className={`inline-flex ${CLASES_NORMAL}`}
              >
                {seccion.etiqueta}
              </a>
            ))}
          </div>
        </details>
      )}
    </nav>
  );
}
