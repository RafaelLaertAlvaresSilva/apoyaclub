import type { ClubProfile, ClubTeam } from "@/lib/types";

/**
 * La ficha del club en una línea: deporte, categoría, tamaño y dónde
 * está.
 *
 * Va justo debajo del logo y del nombre porque es lo que una empresa
 * mira primero y lo que decide si sigue leyendo. Antes todo esto estaba
 * repartido: el deporte y la ciudad en una línea gris bajo el nombre,
 * la máxima categoría en "Palmarés" —a seis secciones de distancia— y
 * el tamaño de la cantera dentro de "Cantera". Para hacerse una idea
 * del club había que recorrer media página.
 *
 * NINGÚN DATO SE INVENTA NI SE RELLENA CON UN CERO. Cada uno sale de un
 * campo que el club ha escrito, y el que no esté escrito no sale: una
 * ficha a medio rellenar enseña dos datos y se ve entera, en vez de
 * enseñar cinco y que tres pongan "0" o "—". Esa es la razón de que
 * esto devuelva una lista filtrada y no una rejilla fija.
 */

type Dato = { clave: string; etiqueta: string; valor: string };

const ICONO: Record<string, React.ReactNode> = {
  deporte: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3" />
    </>
  ),
  categoria: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 008 8M16 5.5h2.5A2.5 2.5 0 0116 8M12 13v3.5M8.5 20h7" />
    </>
  ),
  jugadores: (
    <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
  ),
  cantera: (
    <>
      <path d="M12 21c0-5 2.5-8 7-8 0 5-2.5 8-7 8z" />
      <path d="M12 21c0-5-2.5-8-7-8 0 5 2.5 8 7 8zM12 21v-6" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

/** La máxima categoría, venga de donde venga. */
function maximaCategoria(perfil: ClubProfile): string | null {
  // Desde la migración 0035 se reparte entre masculino y femenino. Si el
  // club todavía no lo ha repartido, sigue valiendo la de antes.
  const repartida = [
    perfil.topCategoryMale && `${perfil.topCategoryMale} (M)`,
    perfil.topCategoryFemale && `${perfil.topCategoryFemale} (F)`,
  ].filter(Boolean);

  if (repartida.length > 0) return repartida.join(" · ");
  return perfil.topCategory ?? null;
}

export function datosDestacados(
  perfil: ClubProfile,
  equipos: ClubTeam[],
  deportes: string[],
  ubicacion: string,
): Dato[] {
  // Los jugadores salen de sumar los equipos que han dicho cuántos son.
  // Si ninguno lo ha dicho, la suma es 0 y el dato no se enseña: un "0
  // jugadores" en la ficha de un club es peor que no poner nada.
  const jugadores = equipos.reduce((suma, equipo) => suma + (equipo.playerCount ?? 0), 0);

  // Los equipos de cantera: lo que el club haya escrito en su ficha y,
  // si no lo ha escrito, lo que se puede contar de sus equipos.
  const equiposCantera =
    perfil.youthTeamsCount ?? equipos.filter((equipo) => equipo.teamLevel === "cantera").length;

  const categoria = maximaCategoria(perfil);

  return [
    deportes.length > 0 && {
      clave: "deporte",
      etiqueta: deportes.length > 1 ? "Deportes" : "Deporte",
      valor: deportes.join(" · "),
    },
    categoria && { clave: "categoria", etiqueta: "Máxima categoría", valor: categoria },
    jugadores > 0 && {
      clave: "jugadores",
      etiqueta: "Jugadores",
      valor: new Intl.NumberFormat("es-ES").format(jugadores),
    },
    equiposCantera > 0 && {
      clave: "cantera",
      etiqueta: "Equipos de cantera",
      valor: String(equiposCantera),
    },
    ubicacion && { clave: "ubicacion", etiqueta: "Dónde está", valor: ubicacion },
  ].filter((dato): dato is Dato => Boolean(dato));
}

/**
 * TODO LO QUE SE ENCOGE, SE ENCOGE SOLO EN EL TELÉFONO (`sm:` devuelve
 * el tamaño de antes). En una pantalla de 390 px las cinco tarjetas
 * llevaban el relleno y la letra del ordenador y ocupaban tres filas
 * largas: la ficha empezaba por el nombre del club y seguía con un
 * muro de cajas antes de llegar a nada más.
 *
 * Se toca el relleno, el cuadro del icono y el cuerpo de la letra. NO
 * se toca la disposición: siguen siendo dos columnas con el icono
 * encima del texto. Ponerlo al lado es justo lo que se probó y se
 * descartó —ver el comentario de abajo—, porque deja al valor con dos
 * tercios del ancho y parte "Primera Nacional (M) · División Oro (F)"
 * en cuatro líneas, que es más alto, no menos.
 */
export function DatosDestacados({ datos }: { datos: Dato[] }) {
  if (datos.length === 0) return null;

  // Una rejilla y no una fila que se reparte sola: con `flex`, cada
  // tarjeta medía lo que medía su texto, y al club con dos categorías
  // —masculina y femenina— se le iba la quinta a una segunda fila,
  // suelta y a media anchura. En rejilla las cinco miden lo mismo y
  // acaban a la misma altura, y el valor largo se parte en dos líneas
  // en vez de descolocar a las demás.
  return (
    <dl className="grid grid-cols-2 items-stretch gap-2 sm:gap-3 md:grid-cols-5">
      {datos.map((dato, indice) => (
        <div
          key={dato.clave}
          /* El icono arriba y el texto debajo, no en dos columnas. Al
             lado, al texto le quedaban dos tercios del ancho y "Primera
             Nacional (M) · Primera Autonómica (F)" se partía en cuatro
             líneas, estirando a las otras cuatro tarjetas con él. Encima,
             el texto usa la tarjeta entera y se queda en dos.
             *
             * En el teléfono van de dos en dos, así que con cinco datos
             * el último se quedaría solo y a media anchura: ahí ocupa la
             * fila entera. A partir de `md` son cinco columnas y esto ya
             * no hace falta. */
          className={`flex min-w-0 flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 sm:gap-2 sm:px-3.5 sm:py-3 ${
            indice === datos.length - 1 && datos.length % 2 === 1
              ? "col-span-2 md:col-span-1"
              : ""
          }`}
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
            >
              {ICONO[dato.clave]}
            </svg>
          </span>

          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
              {dato.etiqueta}
            </dt>
            {/* Sin `truncate`: el valor se parte en dos líneas antes
                que cortarse. "Primera Nacional (M) · Primera Autonómica
                (F)" no cabe en media fila de un teléfono, y cortarlo en
                "Primera Naci…" deja al club sin decir en qué compite,
                que es justo lo que se vino a mirar. La tarjeta crece y
                sus vecinas crecen con ella (`items-stretch`). */}
            <dd className="text-[13px] font-bold leading-snug text-zinc-900 sm:text-sm">{dato.valor}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
