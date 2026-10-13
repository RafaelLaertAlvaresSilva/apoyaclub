/**
 * El símbolo de cada categoría de ideas de patrocinio.
 *
 * UN SOLO SITIO PARA LOS DIECISÉIS. Estos dibujos vivían dentro de
 * `QuePuedesOfrecer`, la rejilla de la página pública. Cuando hizo
 * falta el mismo símbolo en el panel —en las pastillas de "¿No sabes
 * qué ofrecer?"— la salida fácil era copiarlos. Copiados, el día que
 * alguien cambiara el de "Retransmisiones" lo cambiaría en un sitio y
 * no en el otro, y el club vería un símbolo en la web y otro distinto
 * en su panel para la misma categoría. Es el mismo fallo que ya pasó
 * con la lista de categorías, que era de catorce en un sitio y de
 * dieciséis en el otro.
 *
 * Dibujados y no imágenes, y esto no es por ahorrar: las pastillas del
 * panel miden catorce píxeles de alto. Una imagen a ese tamaño es una
 * mancha. Un dibujo se ve nítido en cualquier pantalla, pesa cero,
 * hereda el color de la pastilla —que cambia al seleccionarla— y no
 * son dieciséis archivos más que cargar dentro de un formulario.
 */

const FORMA_DE_LA_CATEGORIA: Record<string, React.ReactNode> = {
  equipos: (
    <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
  ),
  equipaciones: (
    <path d="M8.5 4L5 6l1.5 3.5L8 9v11h8V9l1.5.5L19 6l-3.5-2a3.5 3.5 0 01-7 0z" />
  ),
  instalaciones: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="1.5" />
      <path d="M12 7v12M3 11h3v4H3M21 11h-3v4h3" />
    </>
  ),
  intervalo: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.5M9.5 2.5h5" />
    </>
  ),
  redes: (
    <>
      <circle cx="17" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="18.5" r="2.5" />
      <path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6" />
    </>
  ),
  cantera: (
    <>
      <path d="M12 21c0-5 2.5-8 7-8 0 5-2.5 8-7 8z" />
      <path d="M12 21c0-5-2.5-8-7-8 0 5 2.5 8 7 8zM12 21v-6" />
    </>
  ),
  jugadores: (
    <>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5.5 20.5a6.5 6.5 0 0113 0" />
    </>
  ),
  eventos: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  torneos: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 008 8M16 5.5h2.5A2.5 2.5 0 0116 8M12 13v3.5M8.5 20h7" />
    </>
  ),
  contenido: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" />
    </>
  ),
  digital: (
    <>
      <rect x="2.5" y="5" width="19" height="12" rx="2" />
      <path d="M8.5 21h7M12 17v4" />
    </>
  ),
  retransmisiones: (
    <>
      <rect x="2.5" y="7" width="12" height="10" rx="2" />
      <path d="M14.5 11l6-3v8l-6-3z" />
    </>
  ),
  familias: (
    <>
      <path d="M12 20s-6.5-3.8-6.5-8.5A3.5 3.5 0 0112 9.4a3.5 3.5 0 016.5 2.1C18.5 16.2 12 20 12 20z" />
    </>
  ),
  tienda: (
    <>
      <path d="M5.5 8h13l1 12.5h-15z" />
      <path d="M9 10.5V7a3 3 0 016 0v3.5" />
    </>
  ),
  "visibilidad-local": (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  servicios: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 004.8 4.8l-8 8a2.4 2.4 0 01-3.4-3.4l8-8z" />
      <path d="M14.5 6.5L17 4M6 20l-2 0 0-2" />
    </>
  ),
};

const FORMA_GENERICA = <circle cx="12" cy="12" r="8" />;

export function IconoDeCategoria({
  categoria,
  className = "h-5 w-5",
}: {
  categoria: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {FORMA_DE_LA_CATEGORIA[categoria] ?? FORMA_GENERICA}
    </svg>
  );
}

/** Para la prueba que comprueba que no falta ninguno. */
export const CATEGORIAS_CON_SIMBOLO = Object.keys(FORMA_DE_LA_CATEGORIA);
