type Seccion = { id: string; etiqueta: string };

/**
 * Las dos secciones que llevan a una acción, y por eso quedan siempre a
 * la vista: "Oportunidades disponibles" es lo que el club vende, "Lo
 * que necesitamos" es lo que el club busca. El resto de la ficha
 * —historia, cantera, instalaciones…— es lo que convence, pero nadie
 * escribe a un club por haber leído su palmarés.
 */
const DESTACADAS = ["oportunidades", "servicios"] as const;

/**
 * Ojo con estas clases: ninguna lleva `display` dentro.
 *
 * Lo llevaban, y por eso el desplegable del móvil no servía de nada.
 * Una de estas pastillas se escondía con `hidden`, y `hidden` e
 * `inline-flex` son las dos la misma propiedad de CSS. Con las dos
 * puestas a la vez gana la que el navegador lea la última, que resultó
 * ser `inline-flex`: en el teléfono salían todas las secciones sueltas
 * Y además el desplegable con las mismas dentro. El menú entero, dos
 * veces. El `display` se pone fuera, en cada sitio donde se usan.
 */
const CLASES_PASTILLA = "items-center rounded-full px-4 py-2 text-sm transition-colors";
const CLASES_DESTACADA = `inline-flex ${CLASES_PASTILLA} bg-teal-700 font-semibold text-white hover:bg-teal-800`;
const CLASES_NORMAL = `${CLASES_PASTILLA} border border-zinc-300 bg-white font-medium text-zinc-700 hover:border-teal-600 hover:text-teal-700`;

/**
 * Índice de la ficha del club.
 *
 * Ha pasado por tres formas. Primero una fila con desplazamiento
 * lateral: en el móvil lo que no cabía quedaba detrás de un gesto que
 * nadie hace, así que en la práctica no existía. Después, todas las
 * pastillas desplegadas en el ordenador y un desplegable solo en el
 * móvil: trece pastillas en dos filas delante del contenido, que es
 * mucho ruido antes de haber dicho nada.
 *
 * Ahora, en cualquier pantalla: las dos de acción fuera, y las demás
 * dentro de un botón que las abre en horizontal. Es un `<details>` del
 * propio navegador, sin JavaScript: funciona con la pestaña recién
 * abierta, antes de que cargue nada.
 */
export function IndiceDeSecciones({ secciones }: { secciones: Seccion[] }) {
  const esDestacada = (id: string) => (DESTACADAS as readonly string[]).includes(id);

  const destacadas = secciones.filter((seccion) => esDestacada(seccion.id));
  const resto = secciones.filter((seccion) => !esDestacada(seccion.id));

  if (secciones.length < 2) return null;

  return (
    <nav
      aria-label="Secciones de la ficha"
      className="relative mx-auto mt-6 max-w-5xl px-4 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        {destacadas.map((seccion) => (
          <a key={seccion.id} href={`#${seccion.id}`} className={CLASES_DESTACADA}>
            {seccion.etiqueta}
          </a>
        ))}

        {resto.length > 0 && (
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-teal-600 hover:text-teal-700 [&::-webkit-details-marker]:hidden">
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

            {/* Se abre en horizontal: una fila de pastillas que salta de
                línea cuando no caben, sin desplazamiento lateral, que es
                lo que escondía las últimas.
                *
                * Va suelto por encima (`absolute`) y no dentro del flujo:
                * el `<details>` es un elemento más de la fila de arriba,
                * así que dentro del flujo este panel saldría del ancho
                * del botón, estrecho y en vertical. Suelto ocupa el ancho
                * de la ficha y, de paso, al abrirse no empuja hacia abajo
                * la página entera. El ancla lo pone el `relative` del
                * <nav>, y los `left`/`right` igualan su relleno. */}
            <div className="absolute left-4 right-4 z-20 mt-2 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg sm:left-6 sm:right-6">
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
      </div>
    </nav>
  );
}
