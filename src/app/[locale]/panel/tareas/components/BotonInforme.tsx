/**
 * Los botones para descargar el informe de una empresa.
 *
 * Son formularios normales con POST, no fetch: el navegador ya sabe
 * descargar una respuesta con `Content-Disposition`, y hacerlo a mano
 * con un blob solo añade un sitio más donde fallar. De paso funcionan
 * aunque el JavaScript de la página se haya caído.
 *
 * No llevan "use client" porque no lo necesitan: son HTML.
 *
 * EL PDF MANDA Y EL WORD ACOMPAÑA, y eso se ve en el color: el PDF va
 * relleno y el Word perfilado. No son dos acciones iguales — el informe
 * que el club manda al patrocinador es el PDF; el Word está para quien
 * quiera retocarlo antes. Dos botones rellenos del mismo color
 * obligarían a leer para saber cuál es cuál.
 *
 * Y LOS DOS IGUALES EN LOS DOS SITIOS. Esto antes no era así: en el
 * aviso de arriba el PDF salía relleno y grande, y en la lista de
 * tareas los mismos dos botones salían pequeños y grises, como si
 * fueran otra cosa. `compacto` ahora solo cambia el tamaño y el texto,
 * nunca el color.
 */
export function BotonInforme({
  empresa,
  compacto = false,
}: {
  empresa: string;
  compacto?: boolean;
}) {
  return (
    // `flex-wrap` y sin `shrink-0`: en un móvil estrecho los dos botones
    // ya no caben en la misma línea que el nombre de la empresa, y antes
    // de esto se salían de la pantalla. Ahora bajan y, si hace falta, la
    // etiqueta larga del PDF se parte en dos líneas.
    <span className="flex flex-wrap items-center gap-2">
      <Descarga
        empresa={empresa}
        formato="pdf"
        etiqueta={
          compacto ? "Informe PDF" : "Generar informe de progreso (PDF)"
        }
        titulo={`Descargar en PDF lo que has hecho por ${empresa}`}
        compacto={compacto}
        principal
      />

      <Descarga
        empresa={empresa}
        formato="word"
        etiqueta="Word"
        titulo={`Descargar en Word lo que has hecho por ${empresa}, por si quieres retocarlo`}
        compacto={compacto}
      />
    </span>
  );
}

/**
 * Un botón de descarga: su formulario, su color y su tamaño.
 *
 * Separado porque los dos botones son lo mismo con otro `formato`, y
 * tenerlo dos veces escrito es cómo se acaba con uno de los dos
 * quedándose atrás al cambiar el estilo — que es justo lo que había
 * pasado aquí.
 */
function Descarga({
  empresa,
  formato,
  etiqueta,
  titulo,
  compacto,
  principal = false,
}: {
  empresa: string;
  formato: "pdf" | "word";
  etiqueta: string;
  titulo: string;
  compacto: boolean;
  principal?: boolean;
}) {
  // El tamaño sube lo justo: medido, de 26 px de alto a 34 en la lista
  // de tareas y de 26/36 a 42 en el aviso de arriba. El de antes era
  // más bajo que la yema de un dedo, y en el móvil se fallaba al darle.
  const tamano = compacto
    ? "gap-1.5 px-3 py-1.5 text-sm"
    : "gap-2 px-4 py-2.5 text-sm";

  // Los DOS llevan borde, y el del relleno es de su propio color y no
  // se ve. Es para que midan igual: con borde solo en uno, ese sale dos
  // píxeles más alto que su compañero y quedan desalineados.
  // El borde del relleno va con `bg-` y no con la tinta: tiene que ser
  // EL MISMO color que su fondo para no verse. Con la tinta, que en
  // oscuro es verde claro, el botón salía con un contorno luminoso.
  const color = principal
    ? "border-brand-teal-dark bg-brand-teal-dark text-sobre-color shadow-sm hover:border-accion-fuerte hover:bg-accion-fuerte"
    : "border-accion-tinta bg-white text-accion-tinta hover:bg-teal-50";

  return (
    <form method="post" action="/panel/tareas/informe">
      <input type="hidden" name="empresa" value={empresa} />
      <input type="hidden" name="formato" value={formato} />
      <button
        type="submit"
        className={`inline-flex items-center rounded-lg border text-left font-semibold transition-colors ${tamano} ${color}`}
        title={titulo}
      >
        <IconoDescargar />
        {etiqueta}
      </button>
    </form>
  );
}

/**
 * La flecha de descargar.
 *
 * Dibujada y no un carácter: las flechas de texto (↓, ⬇) salen de un
 * tamaño distinto en cada sistema y en Windows a veces no salen.
 */
function IconoDescargar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 flex-none"
    >
      <path d="M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5" />
      <path d="M5 17.5v1a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5v-1" />
    </svg>
  );
}
