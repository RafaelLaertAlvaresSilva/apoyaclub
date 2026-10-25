import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIAS_IDEA, TOTAL_DE_IDEAS } from "@/lib/catalogo-ideas";
import { PLANES_EN_ORDEN } from "@/lib/planes";
import { LOCALE_CONFIG } from "@/config/locales";
import type { AppLocale } from "@/i18n/routing";
import { FormularioContacto } from "./FormularioContacto";
import { QuePuedesOfrecer } from "./QuePuedesOfrecer";

/**
 * Las secciones largas de la portada, sueltas.
 *
 * Estaban todas dentro de `page.tsx`, una detrás de otra, cuando la
 * portada era la única página que le hablaba a alguien. Desde que hay
 * una página para clubes y otra para empresas, el mismo bloque tiene
 * que poder aparecer en dos sitios, y copiarlo era garantizar que un
 * día dijeran cosas distintas.
 *
 * Cada sección se trae sus propios textos con `getTranslations`: así se
 * pone en cualquier página escribiendo su nombre, sin tener que ir
 * pasándole veinte cadenas desde arriba.
 *
 * Dos reglas de la portada que siguen valiendo aquí:
 *
 *   - Se enseña el producto, no se cuenta. Las maquetas (página de
 *     club, tarjeta de oportunidad, buscador, panel, dossier) valen más
 *     que tres párrafos, y por eso el texto de cada sección es corto.
 *   - Lo que se enseña existe. Los datos de las maquetas son de
 *     muestra y se dice; las funciones que aparecen, no. Ver el embudo:
 *     dibuja los estados reales de `contact_requests`, no un embudo de
 *     manual con etapas que el club no encontraría al entrar.
 */

type TextoConTitulo = { titulo: string; texto: string };

/** Una de las doce. `corto` es la línea de la portada; `texto`, la
 * larga de /para-clubes. */
type Herramienta = { clave: string; titulo: string; corto: string; texto: string };

/**
 * Un icono por herramienta, buscado por su clave.
 *
 * Antes era una lista y el icono se elegía por POSICIÓN. Funcionaba
 * hasta el día en que alguien reordenara los textos: entonces las doce
 * herramientas se quedaban con el icono de la de al lado, y eso no lo
 * detecta ningún test ni ningún compilador. Solo se ve, y tarde.
 *
 * Trazos sueltos en vez de una librería de iconos: son doce dibujos y
 * no compensa cargar un paquete entero.
 */
const ICONO_DE_HERRAMIENTA: Record<string, string> = {
  // Dossier: un documento con su esquina doblada.
  dossier: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zm0 0v4h4M9 13h6M9 17h4",
  // Oportunidades: un rayo.
  oportunidades: "M13 2 3 14h7l-1 8 10-12h-7z",
  // Tareas: una lista con sus marcas.
  tareas: "M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 10M4 18l1.2 1.2L7.5 16",
  // Informe: barras.
  informe: "M3 21h18M6 21V11M12 21V4M18 21v-7",
  // Público: gente.
  publico:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  // Estadísticas: un ojo.
  estadisticas: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  // Solicitudes: un sobre.
  solicitudes: "M3 6h18v12H3zM3 7l9 6 9-6",
  // Patrocinadores: un escudo.
  patrocinadores: "M12 3l8 3v5.5c0 4.7-3.4 8.4-8 9.5-4.6-1.1-8-4.8-8-9.5V6z",
  // A quién escribir: una libreta con renglones.
  objetivos: "M5 3h11l3 3v15H5zM8 8h8M8 12h8M8 16h5",
  // Acción social: un corazón.
  "accion-social": "M12 21S3 15.5 3 9.8A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 9 2.8C21 15.5 12 21 12 21Z",
  // Servicios: una furgoneta.
  servicios:
    "M3 6h11v11H3zM14 10h4l3 3v4h-7zM7.5 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M16 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0",
  // Tu página: una ventana de navegador.
  pagina: "M3 5h18v14H3zM3 9h18M6.5 7h.01M9 7h.01",
  // Las dos que siguen no son herramientas del panel: son para las
  // pastillas del hero, que comparten este mismo mapa.
  // Ideas: una bombilla.
  ideas: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z",
  // Empresas: un edificio con sus ventanas.
  empresas: "M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 10h5a1 1 0 0 1 1 1v10M3 21h18M7 8h3M7 12h3M7 16h3M17 14h0M17 18h0",
};

/** Si algún día aparece una clave sin dibujo, un círculo antes que un
 * hueco: se ve raro y se arregla, en vez de romper la página. */
const ICONO_POR_DEFECTO = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z";

function IconoHerramienta({ clave }: { clave: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONO_DE_HERRAMIENTA[clave] ?? ICONO_POR_DEFECTO} />
    </svg>
  );
}

/** Filo de color de cada tarjeta de oportunidad, por posición. */
const ACENTOS_OPORTUNIDAD = ["bg-brand-navy", "bg-brand-teal-dark", "bg-brand-teal"] as const;

/* ============================================================
   CÓMO FUNCIONA
   ============================================================ */

/**
 * La foto de fondo de un hero.
 *
 * Estaba escrita dos veces, copiada, en la portada y en la página de
 * empresas. Aquí está una sola vez, que es como se descubrió el fallo
 * de abajo: con dos copias, tocar una y olvidar la otra es cuestión de
 * tiempo.
 *
 * EL FALLO DEL MÓVIL. El velo era un círculo (`radial-gradient`)
 * centrado en el hero. En el ordenador el hero es ancho y bajo y el
 * círculo lo cubre entero; en el móvil es estrecho y muy alto, así que
 * el círculo solo tapa la franja del medio y por arriba y por abajo la
 * foto sale a pelo, justo donde cae el texto. Medido en un móvil de
 * 390 px: en la portada la foto desaparecía del todo y en la de
 * empresas se comía el párrafo. Por eso el móvil lleva un velo plano
 * —cubre toda la altura, no solo el centro— y el círculo se queda
 * para `sm` en adelante.
 *
 * `tono` es del color de la foto, no del diseño. Una foto clara
 * aguanta poco velo antes de desaparecer; una oscura necesita más
 * antes de dejar leer. Con un solo ajuste para las dos, una de las
 * dos siempre sale mal.
 */
export function FondoDeHeroe({
  archivo,
  tono,
  velo = "normal",
}: {
  archivo: string;
  tono: "claro" | "oscuro";
  /**
   * Cuánto aprieta el velo blanco que va entre la foto y el texto.
   *
   * No basta con el tono. Dos fotos igual de claras pueden necesitar
   * velos muy distintos según *dónde* tengan el contraste: la del
   * pabellón de "Para clubes" lleva el sol de frente justo detrás del
   * titular, y con el velo normal el texto se pierde contra el
   * resplandor. La de la portada tiene ahí las gradas, que son
   * uniformes, y aguanta con menos.
   */
  velo?: "normal" | "fuerte";
}) {
  const fuerte = velo === "fuerte";
  const opacidad = tono === "claro" ? "opacity-75 sm:opacity-80" : "opacity-30 sm:opacity-40";
  const veloMovil = tono === "claro" ? (fuerte ? "bg-white/58" : "bg-white/40") : "bg-white/65";
  // La foto clara es casi blanca: si el velo aprieta tanto como en la
  // oscura, desaparece. Cada tono lleva el suyo.
  //
  // El fuerte, además de apretar más en el centro, abre la elipse: el
  // texto de estas portadas baja hasta los botones, y una mancha
  // estrecha dejaba fuera justo las dos últimas líneas.
  const veloOrdenador =
    tono === "claro"
      ? fuerte
        ? "bg-[radial-gradient(ellipse_72%_70%_at_50%_45%,rgba(255,255,255,0.86),rgba(255,255,255,0.52)_62%,rgba(255,255,255,0)_100%)]"
        : "bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(255,255,255,0.62),rgba(255,255,255,0.28)_60%,rgba(255,255,255,0)_100%)]"
      : "bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(255,255,255,0.82),rgba(255,255,255,0.45)_60%,rgba(255,255,255,0)_100%)]";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Image
        src={archivo}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover object-[28%_center] sm:object-center ${opacidad}`}
        style={{
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 45%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, #000 30%, transparent 80%)",
        }}
      />

      {/* Móvil: velo plano, de arriba abajo. */}
      <div className={`absolute inset-0 sm:hidden ${veloMovil}`} />

      {/* Ordenador: velo en círculo, más denso en el centro, que es
          donde caen el titular y los botones. */}
      <div className={`absolute inset-0 hidden sm:block ${veloOrdenador}`} />

      {/* Arriba y abajo: el hero empieza pegado a la cabecera blanca y
          acaba pegado a la sección siguiente. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white to-transparent sm:h-36" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-zinc-50 sm:h-40" />
    </div>
  );
}

/**
 * La pantalla que le toca a cada paso.
 *
 * Son capturas de verdad del panel, no dibujos: una plataforma que
 * enseña una interfaz inventada se nota, y lo que hay que demostrar
 * aquí es justamente que esto existe y funciona.
 *
 * La clave manda, no el orden. Si algún día se reordenan los pasos en
 * `home.json`, cada uno se lleva su pantalla; con una lista por
 * posición se quedarían cruzados y eso no lo detecta ningún test.
 */
/* La descripción de cada captura vive en `home.json`
 * (`comoFunciona.capturas.<CLAVE>`), en cada idioma. La `clave` de cada
 * paso NO se traduce: es el identificador que une el paso con su
 * imagen. Lo que se lee en pantalla es `etiqueta`. */
const PANTALLA_DEL_PASO: Record<string, { archivo: string }> = {
  CREA: { archivo: "/paso-perfil.webp" },
  PUBLICA: { archivo: "/paso-oportunidades.webp" },
  CONTACTA: { archivo: "/paso-solicitudes.webp" },
  CRECE: { archivo: "/paso-tareas.webp" },
};

/**
 * El portátil.
 *
 * Dibujado con dos divs y no con una foto de un portátil: pesa cero,
 * se ve nítido en cualquier pantalla y no hay que buscar una foto con
 * la perspectiva correcta para cada captura.
 */
function Portatil({ archivo, alt }: { archivo: string; alt: string }) {
  return (
    <div>
      <div className="rounded-2xl bg-brand-navy p-2.5 pb-3 shadow-2xl shadow-brand-navy/40">
        <Image
          src={archivo}
          alt={alt}
          width={1200}
          height={600}
          sizes="(min-width: 1024px) 46rem, 100vw"
          className="block w-full rounded-md"
        />
      </div>
      {/* La peana, un poco más ancha que la pantalla, con la muesca
          del centro. Es lo que hace que se lea como un portátil y no
          como una captura enmarcada. */}
      <div className="relative -mx-[5%] h-2.5 rounded-b-xl bg-gradient-to-b from-zinc-300 to-zinc-400">
        <span className="absolute left-1/2 top-0 h-1 w-20 -translate-x-1/2 rounded-b-sm bg-zinc-400" />
      </div>
    </div>
  );
}

export async function SeccionComoFunciona() {
  const t = await getTranslations("home");
  const pasos = t.raw("comoFunciona.pasos") as (TextoConTitulo & { clave: string; etiqueta?: string })[];

  return (
    /* `overflow-x-hidden` por la peana del portátil: es un 5 % más
       ancha que la pantalla a propósito —es lo que la hace parecer un
       portátil— y en un teléfono ese 5 % se sale del ancho de la
       página y aparece una barra de desplazamiento horizontal. Se
       recorta aquí en vez de estrechar la peana, para no tocar el
       dibujo. */
    <section
      id="como-funciona"
      className="scroll-mt-32 overflow-x-hidden bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("comoFunciona.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
            {t("comoFunciona.titulo")}
          </h2>
        </div>

        {/* Una fila por paso, alternando el lado del portátil. Eran
            cuatro columnas estrechas, donde una captura saldría del
            tamaño de un sello y no se leería nada.
            *
            * En el móvil no se alterna: todas las filas ponen el texto
            * arriba y la pantalla debajo. Alternar en una sola columna
            * no se ve, y lo único que consigue es que en la mitad de
            * los pasos leas la imagen antes de saber de qué va. */}
        <div className="mt-16 flex flex-col gap-14 sm:gap-16">
          {pasos.map((paso, indice) => {
            const pantalla = PANTALLA_DEL_PASO[paso.clave];
            const claveDelPaso = paso.clave;
            const invertido = indice % 2 === 1;

            return (
              <div
                key={paso.clave}
                className="grid items-center gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-14"
              >
                <div className={invertido ? "lg:order-2" : undefined}>
                  <span className="text-4xl font-extrabold tabular-nums text-brand-teal/45">
                    {String(indice + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-sm font-extrabold uppercase tracking-wider text-accion-tinta">
                    {paso.etiqueta ?? paso.clave}
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold leading-snug text-titular">
                    {paso.titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-[17px] leading-relaxed text-zinc-600">
                    {paso.texto}
                  </p>
                </div>

                {pantalla && (
                  <div className={invertido ? "lg:order-1" : undefined}>
                    <Portatil archivo={pantalla.archivo} alt={t(`comoFunciona.capturas.${claveDelPaso}`)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Se dice que son de verdad, y se dice que los datos no. Las
            dos cosas importan: la primera es lo que hace creíble a la
            sección, y la segunda evita que alguien piense que esos
            patrocinadores son clientes de alguien. */}
        <p className="mt-12 text-center text-[13px] text-zinc-600">
          {t("comoFunciona.pieDeFoto")}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   LO QUE TU CLUB PUEDE OFRECER
   ============================================================ */

export async function SeccionQueOfrece() {
  const t = await getTranslations("home");

  return (
    <section id="clubes" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
          {t("ofrece.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl">
          {t("ofrece.titulo")}
        </h2>
      </div>

      {/* Las pastillas salen de `CATEGORIAS_IDEA`, no de los textos.
          Antes eran una lista escrita a mano en `home.json` que se
          había quedado en catorce mientras el catálogo tenía dieciséis.
          Ver el comentario de `QuePuedesOfrecer`. */}
      <QuePuedesOfrecer />

      <p className="mt-4 text-center text-sm text-zinc-500">{t("ofrece.pie")}</p>

      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-xl font-extrabold leading-snug text-titular sm:text-2xl">
          {t("ofrece.cierre1")}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          {t("ofrece.cierre2")}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   OPORTUNIDADES
   ============================================================ */

/** La pieza central del producto, así que las tarjetas se enseñan como
 * se ven dentro: con precio, con lo que incluye y con su botón. */
export async function SeccionOportunidades() {
  const t = await getTranslations("home");
  const oportunidades = t.raw("oportunidades.ejemplos") as {
    categoria: string;
    titulo: string;
    precio: string;
    periodo: string;
    datos: string[];
    incluye: string[];
    cta: string;
  }[];

  return (
    <section id="oportunidades" className="scroll-mt-32 bg-brand-navy px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">
            {t("oportunidades.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-sobre-color sm:text-4xl">
            {t("oportunidades.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-sobre-color/70">{t("oportunidades.texto")}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {oportunidades.map((oportunidad, indice) => (
            <div
              key={oportunidad.titulo}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/20"
            >
              <div className={`h-1.5 ${ACENTOS_OPORTUNIDAD[indice % ACENTOS_OPORTUNIDAD.length]}`} />
              <div className="flex flex-1 flex-col p-7">
                <Badge tone="teal" className="self-start">
                  {oportunidad.categoria.toUpperCase()}
                </Badge>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-titular">
                  {oportunidad.titulo}
                </h3>

                <p className="mt-3">
                  <span className="text-3xl font-extrabold tracking-tight text-titular">
                    {oportunidad.precio}
                  </span>
                  {oportunidad.periodo && (
                    <span className="text-base text-zinc-500">{oportunidad.periodo}</span>
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {oportunidad.datos.map((dato) => (
                    <span
                      key={dato}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {dato}
                    </span>
                  ))}
                </div>

                <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-5">
                  {oportunidad.incluye.map((cosa) => (
                    <li key={cosa} className="flex items-start gap-2.5">
                      <Tic className="mt-0.5 flex-none text-brand-teal" tamano={16} />
                      <span className="text-sm text-zinc-700">{cosa}</span>
                    </li>
                  ))}
                </ul>

                <span className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-brand-navy px-6 py-3.5 text-sm font-bold text-sobre-color">
                  {oportunidad.cta}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-sobre-color/50">{t("oportunidades.nota")}</p>
      </div>
    </section>
  );
}

/* ============================================================
   LA PÁGINA DEL CLUB
   ============================================================ */

/**
 * Los cuatro iconos de las ventajas de tener página.
 *
 * Dibujados con el mismo trazo que el resto de la web (24x24,
 * `currentColor`, sin relleno): tres de ellos ya existían en otras
 * secciones y se repiten aquí a propósito, porque son el mismo
 * concepto. El del apretón de manos viene de Lucide (licencia ISC).
 */
const ICONO_DE_LA_VENTAJA: Record<string, React.ReactNode> = {
  visibilidad: (
    <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
  ),
  comunidad: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  oportunidades: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),
  gestion: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 008 8M16 5.5h2.5A2.5 2.5 0 0116 8M12 13v3.5M8.5 20h7" />
    </>
  ),
};

const VENTAJAS_DE_LA_PAGINA = ["visibilidad", "comunidad", "oportunidades", "gestion"] as const;

/**
 * La foto del pabellón de pádel, desvanecida, detrás de la sección.
 *
 * No usa `FondoDeHeroe` y no es un olvido: aquel vela la foto con un
 * degradado radial centrado, porque los tres héroes que lo llevan
 * tienen el texto en el medio. Aquí el texto está todo a la izquierda y
 * la pantalla a la derecha, así que el velo va de lado: casi opaco
 * donde hay que leer y más fino donde solo hay foto. Con el radial
 * centrado, el párrafo de la izquierda se quedaba sobre la parte sin
 * velar.
 *
 * Arriba y abajo se funde con el `zinc-50` de la página para que la
 * foto no empiece y acabe con un corte recto.
 */
function FondoDeLaPaginaDelClub() {
  return (
    /* Sin `-z-10`, igual que `FondoDeHeroe`. Con él la foto no se veía:
       un ancestro de esta sección lleva `bg-zinc-50`, y un hijo con
       capa negativa se va DETRÁS de ese fondo, no detrás del texto. Lo
       que pone el texto por delante es que su `<div>` viene después y
       lleva `relative`. */
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/fondo-pagina-club.webp"
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        /* Desenfocada y un poco más grande que su hueco. Nítida
           competía con la captura del monitor —dos imágenes con detalle
           peleando por la misma mirada— y dejaba las pelotas de la
           esquina justo debajo de "Oportunidades". Desenfocada se lee
           como lo que es: el fondo. El `scale` está porque el desenfoque
           difumina también los bordes y, sin agrandarla, quedaba una
           franja clara pegada a los cuatro lados. */
        className="scale-110 object-cover object-center blur-[3px]"
      />

      {/* En el teléfono el texto ocupa todo el ancho, así que el velo
          tiene que ser parejo y fuerte: ahí no hay un lado libre. */}
      <div className="absolute inset-0 bg-white/78 lg:hidden" />

      {/* En el ordenador, de izquierda a derecha: 93% de blanco donde
          empieza el texto y 40% donde acaba la foto. El primer intento
          iba de 95% a 46% y con la foto al 70% de opacidad, y el
          resultado era un gris plano: no se veía que hubiera una foto
          detrás. La foto va ahora a opacidad entera y es el velo, solo
          el velo, el que decide dónde se ve y dónde no. */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.93),rgba(255,255,255,0.84)_38%,rgba(255,255,255,0.52)_66%,rgba(255,255,255,0.40)_100%)] lg:block" />

      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-zinc-50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-50 to-transparent" />
    </div>
  );
}

/**
 * La página del club, enseñada en la pantalla de un ordenador.
 *
 * Antes aquí había una maqueta dibujada con `<div>`: una portada de
 * color liso, un escudo inventado y cuatro números —"12,4k seguidores",
 * "48k de alcance"— que no eran de nadie. Enseñaba la idea de una
 * página, no una página. Ahora es una captura de una página de verdad,
 * con sus datos de verdad, dentro de un monitor.
 *
 * Eso cambia lo que hay que cuidar: una captura envejece. Si la ficha
 * del club cambia de forma, esta imagen se queda contando la de antes,
 * y no hay prueba que avise de eso. Por eso la captura es del club del
 * propio autor y no de un cliente: cuando deje de parecerse, se vuelve
 * a hacer.
 */
export async function SeccionPaginaClub() {
  const t = await getTranslations("home");

  return (
    <section
      id="tu-pagina"
      className="relative scroll-mt-32 overflow-hidden px-4 py-20 sm:px-6 sm:py-28"
    >
      <FondoDeLaPaginaDelClub />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          {/* El epígrafe con su rayita al lado, como en el diseño. */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
              {t("paginaClub.eyebrow")}
            </p>
            <span className="h-px w-12 flex-none bg-brand-teal/50" aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl">
            {t("paginaClub.titulo")}
          </h2>
          <p className="mt-5 leading-relaxed text-zinc-600">{t("paginaClub.texto")}</p>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("paginaClub.texto2")}</p>

          {/* Dos y dos, no cuatro en fila: aquí solo hay media pantalla
              de ancho, y en cuatro columnas "Gestión sencilla" se parte
              en tres líneas y descoloca a las otras tres.

              EL ICONO VA AL LADO DEL TÍTULO A PARTIR DE `lg`, no encima.
              Encima, los cuatro puntos medían 559 px desde el epígrafe y
              en una pantalla de portátil los dos de abajo se quedaban
              cortados: se veía el icono y no lo que ponía. Al lado, el
              icono y el título comparten línea y cada punto pierde 32 px
              —el alto del icono más su margen—, que por cuatro puntos y
              con el hueco un poco más corto son los 70 px que faltaban.

              Solo a partir de `lg` porque es donde esto se pone en dos
              columnas y la altura empieza a importar. Por debajo va todo
              en una columna, se baja desplazándose y el icono encima se
              lee mejor; además, en un teléfono "Gestión sencilla" al
              lado de un icono de 44 px no cabe en una línea. */}
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6">
            {VENTAJAS_DE_LA_PAGINA.map((ventaja) => (
              <li key={ventaja}>
                <div className="lg:flex lg:items-center lg:gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[22px] w-[22px]"
                    >
                      {ICONO_DE_LA_VENTAJA[ventaja]}
                    </svg>
                  </span>
                  <p className="mt-3 text-[15px] font-bold text-titular lg:mt-0">
                    {t(`paginaClub.ventajas.${ventaja}.titulo`)}
                  </p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 lg:mt-2">
                  {t(`paginaClub.ventajas.${ventaja}.texto`)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <MaquetasDeLaPagina
          url={t("paginaClub.maqueta.url")}
          alt={t("paginaClub.maqueta.alt")}
          altTelefono={t("paginaClub.maqueta.altTelefono")}
        />
      </div>
    </section>
  );
}

/**
 * Las dos maquetas, una al lado de la otra: el monitor y el teléfono.
 *
 * El teléfono no es un adorno ni una repetición del monitor. La mitad
 * larga de las visitas a la ficha de un club llega desde un enlace
 * compartido por WhatsApp, y eso se abre en un teléfono. Un club que se
 * está planteando pagar quiere ver cómo le queda SU página ahí, no solo
 * en una pantalla grande que a lo mejor no usa nadie.
 *
 * Pegadas por abajo (`items-end`) y no centradas: son dos aparatos
 * apoyados en la misma mesa. Centrados, el teléfono flota a media
 * altura y se nota que son dos imágenes pegadas.
 *
 * El teléfono se lleva un porcentaje del ancho y no una medida fija,
 * para que la pareja se encoja junta. Con un ancho fijo, en una
 * pantalla estrecha el teléfono se comía la mitad del hueco y el
 * monitor se quedaba en un sello.
 */
function MaquetasDeLaPagina({
  url,
  alt,
  altTelefono,
}: {
  url: string;
  alt: string;
  altTelefono: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] items-end gap-3 sm:gap-4 lg:max-w-none">
      <MonitorConLaPagina url={url} alt={alt} />
      <TelefonoConLaPagina alt={altTelefono} />
    </div>
  );
}

/**
 * El teléfono: marco oscuro de esquinas muy redondeadas y dentro la
 * captura.
 *
 * La captura entra con la barra de direcciones de Chrome y sin la barra
 * de estado de Android. La barra de direcciones se queda porque enseña
 * la dirección de verdad, igual que la barra dibujada del monitor; la
 * hora y el porcentaje de batería del teléfono de quien hizo la captura
 * no pintan nada en la web.
 *
 * Sin muesca ni altavoz dibujados: a este tamaño serían dos píxeles
 * grises sobre una barra que ya es negra, y no se distinguirían de
 * suciedad. Lo que hace que se lea como un teléfono es la proporción
 * alta y el redondeo, no los detalles.
 */
function TelefonoConLaPagina({ alt }: { alt: string }) {
  return (
    <div className="w-[26%] flex-none lg:w-[22%]">
      <div className="overflow-hidden rounded-[1.4rem] border-4 border-zinc-800 bg-zinc-800 shadow-xl shadow-brand-navy/25 sm:rounded-[1.7rem] sm:border-[6px]">
        <Image
          src="/pagina-club-telefono.webp"
          alt={alt}
          width={640}
          height={1243}
          loading="lazy"
          sizes="(max-width: 1024px) 28vw, 140px"
          className="block h-auto w-full rounded-[1.1rem]"
        />
      </div>
    </div>
  );
}

/**
 * El monitor: marco, barra de navegador, captura, cuello y peana.
 *
 * El marco y la peana son `<div>` de color, no una imagen de un
 * ordenador: una foto de monitor obliga a encajar la captura dentro con
 * perspectiva y se ve mal en cuanto cambia el ancho. Dibujado, se
 * adapta solo.
 */
function MonitorConLaPagina({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-2xl border-[10px] border-zinc-800 bg-zinc-800 shadow-2xl shadow-brand-navy/25 sm:border-[12px]">
        <div className="overflow-hidden rounded-md bg-white">
          <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden="true" />
            <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-[10px] text-zinc-500">
              {url}
            </span>
          </div>

          <Image
            src="/pagina-club-ejemplo.webp"
            alt={alt}
            width={1331}
            height={577}
            loading="lazy"
            sizes="(max-width: 1024px) 92vw, 560px"
            className="block h-auto w-full"
          />
        </div>
      </div>

      {/* El cuello y la peana. `aria-hidden` porque no son información:
          lo que hay que leer es la captura, y su texto va en el `alt`. */}
      <div aria-hidden="true">
        <div className="mx-auto h-5 w-16 bg-zinc-800" />
        <div className="mx-auto h-2.5 w-36 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

/* ============================================================
   PARA EMPRESAS: EL BUSCADOR
   ============================================================ */

/** Cuatro preguntas a la vista y el resto escondido. El buscador de
 * dentro tiene muchos más filtros; enseñarlos todos aquí haría que
 * pareciera complicado justo en el momento en que hay que parecer
 * fácil. */
/** Los iconos de las seis razones. */
const ICONO_DEL_BENEFICIO: Record<string, React.ReactNode> = {
  visibilidad: (
    <>
      <path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" />
      <path d="M15 8.5a4 4 0 010 7M18 6a7.5 7.5 0 010 12" />
    </>
  ),
  comunidad: (
    <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
  ),
  reputacion: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  fiscal: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M14 12h-3.5a1.5 1.5 0 000 3h2a1.5 1.5 0 010 3H9M11.5 11v8" />
    </>
  ),
  medida: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  impacto: (
    <>
      <path d="M5 20c0-7 4-11 14-11 0 7-4 11-14 11z" />
      <path d="M5 20c2-5 5-7 9-8.5" />
    </>
  ),
};

/** Los iconos de la franja de cierre. */
const ICONO_DEL_CIERRE: Record<string, React.ReactNode> = {
  gratis: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9.5h5M9 14.5h5M11 7v10" />
    </>
  ),
  directo: (
    <>
      <path d="M4 5h16v11H8l-4 4V5z" />
      <path d="M8.5 10.5h7" />
    </>
  ),
  digital: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
};

/**
 * Por qué a una empresa le interesa, con el dato que sostiene cada
 * razón.
 *
 * Va justo debajo de la portada de /para-empresas: quien acaba de
 * pulsar "soy una empresa" todavía no sabe por qué debería seguir
 * leyendo, y esto se lo dice antes que ninguna otra cosa.
 *
 * AVISO PARA QUIEN TOQUE ESTO DESPUÉS. La maqueta de la que salió
 * traía un porcentaje con fuente en cada tarjeta: "el 77 % de los
 * consumidores…" (Nielsen), "el 70 % de las familias…" (UEFA), "el
 * 85 %…" (Cone Communications), "el 63 % de las marcas…" (IEG), "el
 * 64 % de las empresas…" (Asociación Española de la Comunicación).
 * Ninguno se pudo encontrar publicado, el estudio de Cone que se
 * citaba como de 2023 es de 2017, y el dato fiscal era falso de dos
 * maneras seguidas: primero prometía "hasta un 40 % de deducción"
 * (eso es de los donativos, no del patrocinio) y después "deducción
 * del 25 %, 35 % en algunos casos" (el 25 % es el TIPO del impuesto,
 * no una deducción, y el 35 % no existe en el IS español).
 *
 * Las seis cifras que hay ahora están comprobadas y dos de ellas se
 * pueden contar aquí mismo: las 128 ideas y las 16 categorías salen
 * de `catalogo-ideas.ts`, y hay una prueba que lo verifica. Si se
 * añade una séptima, que venga con su fuente y su año.
 */
export async function SeccionBeneficiosEmpresa() {
  const t = await getTranslations("home");
  const tarjetas = t.raw("paraEmpresas.beneficios.tarjetas") as {
    clave: string;
    titulo: string;
    texto: string;
    cifra: string;
    dato: string;
    fuente: string;
    aviso?: string;
  }[];
  const cierre = t.raw("paraEmpresas.beneficios.franja") as {
    clave: string;
    titulo: string;
    texto: string;
  }[];

  return (
    <section
      id="beneficios"
      className="relative isolate scroll-mt-32 overflow-hidden border-b border-zinc-200 bg-white px-4 py-20 sm:px-6 sm:py-24"
    >
      {/* La foto, solo de ordenador. En el teléfono esta sección son
          seis tarjetas de texto apiladas y una foto detrás no se vería
          más que en los huecos: peso de descarga a cambio de nada. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <Image
          src="/fondo-beneficios.webp"
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/80" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("paraEmpresas.beneficios.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl">
            {t("paraEmpresas.beneficios.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">
            {t("paraEmpresas.beneficios.subtitulo")}
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tarjetas.map((tarjeta) => (
            <div
              key={tarjeta.clave}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-colors hover:border-brand-teal/50"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-teal-light text-accion-tinta">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    {ICONO_DEL_BENEFICIO[tarjeta.clave] ?? ICONO_POR_DEFECTO}
                  </svg>
                </span>
                <h3 className="pt-1 font-extrabold leading-snug text-titular">
                  {tarjeta.titulo}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{tarjeta.texto}</p>

              {/* El recuadro del dato. `mt-auto` lo pega abajo: los seis
                  textos miden distinto y sin esto cada recuadro quedaba
                  a una altura, que es lo que hace que una rejilla de
                  tarjetas parezca descuadrada. */}
              <div className="mt-auto pt-4">
                <div className="rounded-xl bg-brand-teal-light/60 px-4 py-3.5">
                  <p className="text-lg font-extrabold leading-tight tracking-tight text-accion-tinta tabular-nums">
                    {tarjeta.cifra}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-titular">{tarjeta.dato}</p>
                  {/* La fuente y, en la única tarjeta que lo lleva, el
                      aviso: en el mismo párrafo y no en dos. Son seis
                      tarjetas en una rejilla de tres columnas, y todas
                      crecen hasta la altura de la más alta: cada bloque
                      de más que lleve una abre un hueco blanco en las
                      otras dos de su fila. */}
                  <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                    {tarjeta.fuente}
                    {tarjeta.aviso ? ` · ${tarjeta.aviso}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* La franja de cierre. Sin cifras a propósito: las seis están
            arriba, y repetirlas aquí no las hace más ciertas. Lo que
            falta a estas alturas no es otro dato, es el botón. */}
        <div className="mt-6 rounded-3xl bg-brand-navy p-8 sm:p-10">
          <h3 className="max-w-2xl text-xl font-extrabold leading-snug text-sobre-color sm:text-2xl">
            {t("paraEmpresas.beneficios.franjaTitulo")}
          </h3>

          <div className="mt-8 grid gap-7 sm:grid-cols-3">
            {cierre.map((bloque) => (
              <div key={bloque.clave} className="flex gap-3.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10 text-brand-teal-light">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    {ICONO_DEL_CIERRE[bloque.clave] ?? ICONO_POR_DEFECTO}
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sobre-color">{bloque.titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-sobre-color/75">{bloque.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/buscar?busca=patrocinios"
            className="mt-9 inline-flex items-center justify-center rounded-xl bg-brand-teal-light px-6 py-3.5 font-bold text-titular transition-colors hover:bg-white"
          >
            {t("paraEmpresas.beneficios.franjaCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export async function SeccionBuscadorEmpresas() {
  const t = await getTranslations("home");
  const resultadosEjemplo = t.raw("empresas.resultados") as {
    categoria: string;
    titulo: string;
    texto: string;
    precio: string;
  }[];

  return (
    <section id="empresas" className="scroll-mt-32 bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("empresas.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
            {t("empresas.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("empresas.texto")}</p>
        </div>

        {/* El aviso de que esto es una maqueta va ANTES, no debajo en
            gris claro cuando ya has intentado escribir en las casillas.
            Y el recuadro entero es un enlace al buscador de verdad:
            antes se podían tocar cuatro cosas que no respondían, en la
            única sección pensada para la empresa. */}
        <p className="mt-10 text-center text-sm font-medium text-zinc-500">{t("empresas.nota")}</p>

        <Link
          href="/buscar"
          className="mx-auto mt-3 block max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-brand-navy/5 transition-colors hover:border-brand-teal sm:p-7"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CasillaFiltro
              etiqueta={t("empresas.filtros.presupuestoEtiqueta")}
              valor={t("empresas.filtros.presupuestoValor")}
            />
            <CasillaFiltro
              etiqueta={t("empresas.filtros.ubicacionEtiqueta")}
              valor={t("empresas.filtros.ubicacionValor")}
            />
            <CasillaFiltro
              etiqueta={t("empresas.filtros.deporteEtiqueta")}
              valor={t("empresas.filtros.deporteValor")}
            />
            <CasillaFiltro
              etiqueta={t("empresas.filtros.publicoEtiqueta")}
              valor={t("empresas.filtros.publicoValor")}
            />
          </div>

          <span className="mt-5 flex w-full items-center justify-center rounded-2xl bg-brand-teal-dark px-6 py-4 text-base font-bold text-sobre-color">
            {t("empresas.filtros.buscar")}
          </span>
        </Link>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {resultadosEjemplo.map((resultado) => (
            <div
              key={resultado.titulo}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <Badge tone="teal" className="mb-3 self-start">
                {resultado.categoria.toUpperCase()}
              </Badge>
              <h3 className="text-[15px] font-bold leading-snug text-titular">
                {resultado.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{resultado.texto}</p>
              <div className="mt-4 text-xl font-extrabold text-titular">{resultado.precio}</div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-sm font-medium text-zinc-600">{t("empresas.gratis")}</p>
      </div>
    </section>
  );
}

/* ============================================================
   EL EMBUDO
   ============================================================ */

/** Los cuatro estados son los que tiene de verdad una solicitud en
 * `contact_requests`. Si algún día se añaden etapas, se cambian aquí;
 * lo que no puede pasar es que la portada dibuje un embudo que el club
 * no se encuentra al entrar. */
export async function SeccionEmbudo() {
  const t = await getTranslations("home");
  const estadosEmbudo = t.raw("embudo.estados") as { nombre: string; texto: string }[];
  const m = t.raw("embudo.maqueta") as MaquetaEmbudo;
  const resalte = (trozo: React.ReactNode) => <span className="text-accion-tinta">{trozo}</span>;
  const negrita = (trozo: React.ReactNode) => <strong className="font-semibold text-titular">{trozo}</strong>;

  // Cada paso con su dibujo y su color: el mismo número de color en la
  // casilla y en su dibujo, para que se lea como una secuencia.
  const pasos = [
    { tono: "bg-sky-100 text-sky-800", maqueta: <MaquetaAviso m={m} /> },
    { tono: "bg-amber-100 text-amber-800", maqueta: <MaquetaLista m={m} estados={estadosEmbudo} /> },
    { tono: "bg-teal-100 text-teal-800", maqueta: <MaquetaConversacion m={m} estado={estadosEmbudo[2]?.nombre ?? ""} /> },
    { tono: "bg-emerald-100 text-emerald-800", maqueta: <MaquetaCerrada m={m} /> },
  ];

  return (
    <section id="seguimiento" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-14 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
          {t("embudo.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl">
          {t.rich("embudo.titulo", { resalte })}
        </h2>
        <p className="mt-4 leading-relaxed text-zinc-600">{t.rich("embudo.texto", { b: negrita })}</p>
      </div>

      {/* Fuera de la vista pero para los lectores de pantalla: en el
          dibujo las flechas ya dicen que es una secuencia. */}
      <p className="sr-only">{t("embudo.comoSeLee")}</p>

      {/* UNA SOLA LISTA que cambia de forma con el ancho. En el teléfono,
          un recuadro con las cuatro frases separadas por una raya y sin
          dibujos (eran 700 px para cuatro frases cortas). A partir de
          `sm`, tarjetas; en `lg`, las cuatro en fila con flechas.

          Los dibujos enseñan lo que el club ve de verdad: la bandeja de
          Solicitudes y el botón de apuntar lo prometido. Nada de
          burbujas de chat: en ApoyaClub no se chatea, la conversación
          sigue por teléfono o correo. */}
      <ol className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:grid sm:gap-5 sm:divide-y-0 sm:overflow-visible sm:border-0 sm:bg-transparent sm:grid-cols-2 lg:grid-cols-4">
        {estadosEmbudo.map((estado, indice) => (
          <li
            key={estado.nombre}
            className="relative flex flex-col p-4 sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-white sm:p-6 sm:shadow-sm"
          >
            <div className="flex items-center gap-2.5 sm:block">
              <span
                className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-extrabold sm:h-11 sm:w-11 sm:text-lg ${pasos[indice]?.tono ?? ""}`}
              >
                {indice + 1}
              </span>
              <h3 className="font-extrabold text-titular sm:mt-4 sm:text-xl">{estado.nombre}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 sm:mt-2">{estado.texto}</p>

            <div aria-hidden="true" className="mt-5 hidden flex-1 items-end sm:flex">
              <div className="w-full">{pasos[indice]?.maqueta}</div>
            </div>

            {indice < estadosEmbudo.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -right-[18px] top-24 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-accion-tinta shadow-sm ring-1 ring-zinc-200 lg:flex"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Descartada, aparte y debajo: no es un paso más, es la salida
          que puede tomar cualquiera de ellos. */}
      <div className="mx-auto mt-5 flex max-w-3xl items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 sm:mt-6 sm:px-6 sm:py-5">
        <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M5.6 5.6l12.8 12.8" />
          </svg>
        </span>
        <span>
          <span className="block font-extrabold text-titular">{t("embudo.descartada")}</span>
          <span className="block text-sm leading-relaxed text-zinc-600">{t("embudo.descartadaTexto")}</span>
        </span>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] font-semibold leading-relaxed text-titular sm:mt-10 sm:text-lg">
        {t.rich("embudo.cierre", { resalte })}
      </p>
      <p className="mt-3 hidden text-center text-xs text-zinc-400 sm:block">{t("embudo.maqueta.nota")}</p>
    </section>
  );
}

type MaquetaEmbudo = {
  avisoTitulo: string;
  avisoTexto: string;
  hora: string;
  empresas: { nombre: string; cuando: string }[];
  mensaje: string;
  correo: string;
  telefono: string;
  cerradoTitulo: string;
  cerradoBoton: string;
  tareas: string[];
};

/** Paso 1: el aviso que le llega al club al correo. */
function MaquetaAviso({ m }: { m: MaquetaEmbudo }) {
  return (
    <div className="relative -rotate-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-md">
      <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-peligro" />
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-bold leading-tight text-titular">{m.avisoTitulo}</span>
            <span className="text-[10px] text-zinc-400">{m.hora}</span>
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{m.avisoTexto}</span>
        </span>
      </div>
    </div>
  );
}

/** Paso 2: la bandeja de Solicitudes, con su recuento por estado. */
function MaquetaLista({ m, estados }: { m: MaquetaEmbudo; estados: { nombre: string }[] }) {
  const cuentas = [3, 5, 4, 12];
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-[11px] shadow-sm">
      <ul className="flex flex-wrap gap-1 border-b border-zinc-100 bg-zinc-50 p-1.5">
        {estados.map(({ nombre }, indice) => (
          <li
            key={nombre}
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${indice === 1 ? "bg-amber-100 font-semibold text-amber-900" : "text-zinc-500"}`}
          >
            {nombre}
            <span className="tabular-nums opacity-70">{cuentas[indice]}</span>
          </li>
        ))}
      </ul>
      <ul className="divide-y divide-zinc-100">
        {m.empresas.map((empresa) => (
          <li key={empresa.nombre} className="flex items-center gap-2 px-2.5 py-1.5">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
              {empresa.nombre.charAt(0)}
            </span>
            <span className="min-w-0 flex-1 font-semibold text-titular">{empresa.nombre}</span>
            <span className="text-[10px] text-zinc-400">{empresa.cuando}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Paso 3: la solicitud abierta, con lo que escribió y cómo contestarle. */
function MaquetaConversacion({ m, estado }: { m: MaquetaEmbudo; estado: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-titular">{m.empresas[0]?.nombre}</span>
        <span className="whitespace-nowrap rounded-full bg-aviso px-1.5 py-0.5 text-[10px] font-semibold text-sobre-aviso">{estado}</span>
      </div>
      <p className="mt-2 rounded-lg bg-zinc-50 p-2 leading-snug text-zinc-600">{m.mensaje}</p>
      <div className="mt-2 flex flex-col gap-0.5 text-teal-700">
        <span className="break-all">{m.correo}</span>
        <span>{m.telefono}</span>
      </div>
    </div>
  );
}

/** Paso 4: acuerdo cerrado y lo prometido, ya en Tareas. */
function MaquetaCerrada({ m }: { m: MaquetaEmbudo }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-500 text-sobre-color">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <span className="text-xs font-bold text-titular">{m.cerradoTitulo}</span>
      </div>
      <span className="mt-2 inline-block rounded-md bg-accion px-2 py-1 text-[10px] font-semibold text-sobre-color">
        {m.cerradoBoton} →
      </span>
      <ul className="mt-2 flex flex-col gap-1">
        {m.tareas.map((tarea) => (
          <li key={tarea} className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-3 w-3 flex-none rounded border border-emerald-400" />
            <span className="leading-tight">{tarea}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   DOSSIER
   ============================================================ */

/* La sección suelta "Dossier automático" vivía aquí.
 *
 * Decía lo mismo que la primera de las doce herramientas que venía
 * justo debajo —"Dossier en PDF y en Word"—: el mismo argumento, dos
 * veces seguidas, con su propio título, su párrafo y un botón de
 * mentira. 719 px en un teléfono para no añadir nada.
 *
 * Lo único suyo que no estaba repetido era la maqueta de las dos hojas,
 * que es la única vez en toda la web que se ve qué pinta tiene un
 * dossier. Eso no se tira: se ha mudado dentro de la tarjeta del
 * dossier, que es donde está el argumento. Así se ve lo mismo y se
 * dice una sola vez.
 */

/** Las secciones del menú del panel que dibuja la maqueta, en su orden real. */
const ENLACES_MAQUETA_PANEL = [
  { clave: "inicio", icono: "casa" },
  { clave: "perfil", icono: "escudo" },
  { clave: "oportunidades", icono: "bombilla" },
  { clave: "solicitudes", icono: "sobre" },
  { clave: "dossier", icono: "documento" },
  { clave: "patrocinadores", icono: "personas" },
  { clave: "tareas", icono: "tarea" },
] as const;

/** Color e icono de cada cifra, en el orden de `panel.metricas`. */
const ESTILOS_METRICA_PANEL = [
  { icono: "bombilla", fondo: "bg-teal-400/15 text-teal-300" },
  { icono: "barras", fondo: "bg-sky-400/15 text-sky-300" },
  { icono: "ojo", fondo: "bg-violet-400/15 text-violet-300" },
  { icono: "sobre", fondo: "bg-sky-400/15 text-sky-300" },
  { icono: "tarea", fondo: "bg-amber-400/15 text-amber-300" },
  { icono: "personas", fondo: "bg-emerald-400/15 text-emerald-300" },
] as const;

type NombreIconoPanel = "casa" | "escudo" | "bombilla" | "sobre" | "documento" | "personas" | "tarea" | "barras" | "ojo";

const TRAZOS_ICONO_PANEL: Record<NombreIconoPanel, React.ReactNode> = {
  casa: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  escudo: <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />,
  bombilla: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />,
  sobre: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  documento: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  personas: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.8 3 2.6 3.5 5.2" />
    </>
  ),
  tarea: (
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 3h6v3H9zM8.5 13l2.5 2.5 4.5-5" />
    </>
  ),
  barras: (
    <>
      <rect x="4" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="7" width="4" height="13" rx="1" />
      <rect x="16" y="3" width="4" height="17" rx="1" />
    </>
  ),
  ojo: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

function IconoMaquetaPanel({ nombre, grande = false }: { nombre: NombreIconoPanel; grande?: boolean }) {
  const lado = grande ? 24 : 18;
  return (
    <svg width={lado} height={lado} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
      {TRAZOS_ICONO_PANEL[nombre]}
    </svg>
  );
}

/** Dónde va cada herramienta en la rejilla de 12 columnas del ordenador. */
const CELDA_HERRAMIENTA: Record<string, string> = {
  dossier: "lg:col-span-4 lg:row-span-2",
  oportunidades: "lg:col-span-4",
  tareas: "lg:col-span-4",
  informe: "lg:col-span-4",
  publico: "lg:col-span-4",
  estadisticas: "lg:col-span-4",
  solicitudes: "lg:col-span-4",
  patrocinadores: "lg:col-span-4",
};

/**
 * Un dibujo pequeño por herramienta, hecho con cajas y trazos: pesa
 * casi nada, se ve nítido en cualquier pantalla y no lleva texto
 * dentro, así que vale igual en los tres idiomas. Si una herramienta
 * no tiene dibujo, no sale nada.
 */
function DibujoHerramienta({ clave }: { clave: string }) {
  const caja = "rounded-xl border border-zinc-200 bg-white shadow-md shadow-brand-navy/5";
  const linea = (ancho: string, color = "bg-zinc-200") => <span className={`block h-1.5 rounded ${ancho} ${color}`} />;
  switch (clave) {
    case "oportunidades":
      return (
        <div className="relative h-20 w-36">
          <svg className="absolute left-0 top-0 text-amber-400" width="38" height="38" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
            <rect x="9" y="19" width="6" height="2.5" rx="1" className="text-zinc-400" fill="currentColor" />
          </svg>
          <div className={`absolute bottom-0 right-0 flex w-24 flex-col gap-1.5 p-2.5 ${caja}`}>
            {["w-full", "w-4/5", "w-11/12"].map((ancho, i) => (
              <span key={ancho} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 flex-none rounded-sm ${i < 2 ? "bg-brand-teal" : "border border-zinc-300"}`} />
                {linea(ancho)}
              </span>
            ))}
          </div>
        </div>
      );
    case "tareas":
      return (
        <div className="relative h-20 w-32">
          <div className={`absolute left-0 top-0 w-24 overflow-hidden ${caja}`}>
            <span className="block h-3 bg-blue-500" />
            <span className="flex flex-col gap-1.5 p-2">
              {["w-full", "w-4/5", "w-11/12"].map((ancho) => (
                <span key={ancho} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 flex-none rounded-sm bg-brand-teal" />
                  {linea(ancho)}
                </span>
              ))}
            </span>
          </div>
          <svg className="absolute bottom-0 right-0 text-blue-600" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" fill="white" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
      );
    case "informe":
      return (
        <div className={`flex h-20 w-28 items-end gap-1.5 p-3 ${caja}`}>
          {["h-3", "h-5", "h-7", "h-10", "h-12"].map((alto, i) => (
            <span key={alto} className={`w-3 rounded-t ${alto} ${i > 2 ? "bg-brand-navy" : "bg-brand-teal"}`} />
          ))}
        </div>
      );
    case "publico":
      return (
        <div className="relative h-20 w-32 overflow-hidden rounded-xl bg-gradient-to-b from-sky-200 to-sky-400 shadow-md">
          {[0, 1, 2].map((fila) => (
            <span key={fila} className="absolute left-2 right-2 flex justify-between" style={{ top: 10 + fila * 16 }}>
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="h-3 w-3 rounded-full bg-brand-navy/70" />
              ))}
            </span>
          ))}
          <span className={`absolute bottom-1.5 right-1.5 flex items-end gap-1 px-2 py-1.5 ${caja}`}>
            {["h-2", "h-3", "h-4"].map((alto) => (
              <span key={alto} className={`w-1.5 rounded-t bg-brand-teal ${alto}`} />
            ))}
          </span>
        </div>
      );
    case "estadisticas":
      return (
        <div className="flex flex-col items-center">
          <div className="h-16 w-28 rounded-t-lg border-4 border-b-0 border-brand-navy bg-white p-2">
            <svg width="100%" height="100%" viewBox="0 0 80 36" fill="none">
              <path d="M2 30 L20 22 L34 26 L52 12 L78 4" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
              <circle cx="14" cy="10" r="6" stroke="#0b1f38" strokeWidth="2.5" />
              <circle cx="14" cy="10" r="2" fill="#0b1f38" />
            </svg>
          </div>
          <span className="block h-2 w-36 rounded-b-lg bg-zinc-300" />
        </div>
      );
    case "solicitudes":
      return (
        <div className={`relative w-28 p-2.5 ${caja}`}>
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-peligro text-[11px] font-bold text-sobre-color">3</span>
          <span className="mb-2 block h-2.5 w-full rounded bg-blue-500" />
          {["w-full", "w-4/5", "w-11/12"].map((ancho) => (
            <span key={ancho} className="mb-1.5 flex items-center gap-1.5">
              <span className="h-2.5 w-3.5 flex-none rounded-sm border border-blue-400" />
              {linea(ancho)}
            </span>
          ))}
        </div>
      );
    case "patrocinadores":
      return (
        <div className="relative h-20 w-32">
          <svg className="absolute right-6 top-0" width="34" height="38" viewBox="0 0 24 28">
            <path d="M12 1l10 4v8c0 6-4.4 11-10 13C6.4 24 2 19 2 13V5z" fill="#1d4ed8" />
            <path d="M12 4l7 3v6c0 4.4-3 8-7 9.5V4z" fill="#facc15" />
          </svg>
          <span className={`absolute bottom-0 left-0 flex h-9 w-16 items-center justify-center gap-1 ${caja}`}>
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="h-1.5 w-7 rounded bg-brand-navy" />
          </span>
          <span className={`absolute bottom-3 right-0 flex h-9 w-14 rotate-3 items-center justify-center ${caja}`}>
            <span className="h-2 w-9 rounded bg-red-500" />
          </span>
        </div>
      );
    case "objetivos":
      return (
        <div className={`flex w-28 flex-col gap-1.5 p-2.5 ${caja}`}>
          {["bg-zinc-200", "bg-amber-200", "bg-blue-200"].map((color) => (
            <span key={color} className="flex items-center gap-2">
              <span className="h-4 w-4 flex-none rounded-full bg-brand-navy/70" />
              <span className={`h-3 flex-1 rounded-full ${color}`} />
            </span>
          ))}
        </div>
      );
    case "accion-social":
      return (
        <svg width="80" height="64" viewBox="0 0 80 64" fill="none">
          <path d="M40 46C24 34 18 26 18 18a10 10 0 0 1 22-4 10 10 0 0 1 22 4c0 8-6 16-22 28z" fill="#ef4444" />
          <path d="M6 44c8 2 14 8 20 14h28c6-6 12-12 20-14" stroke="#f5c9a5" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case "servicios":
      return (
        <div className="relative h-20 w-36">
          <svg className="absolute bottom-0 left-0" width="76" height="46" viewBox="0 0 76 46">
            <path d="M2 10a6 6 0 0 1 6-6h36v30H2z" fill="#f4f4f5" stroke="#0b1f38" strokeWidth="2" />
            <path d="M44 14h14l12 12v8H44z" fill="#e4e4e7" stroke="#0b1f38" strokeWidth="2" />
            <circle cx="16" cy="38" r="6" fill="#0b1f38" />
            <circle cx="58" cy="38" r="6" fill="#0b1f38" />
          </svg>
          <span className="absolute right-6 top-1 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="#ef4444" /></svg>
          </span>
          <svg className="absolute bottom-0 right-0" width="28" height="28" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10.5" fill="white" stroke="#0b1f38" strokeWidth="1.8" />
            <path d="M12 7.5l3.6 2.6-1.4 4.2H9.8L8.4 10.1z" fill="#0b1f38" />
            <path d="M12 7.5V3M15.6 10.1l4-1.5M14.2 14.3l2.6 3.7M9.8 14.3l-2.6 3.7M8.4 10.1l-4-1.5" stroke="#0b1f38" strokeWidth="1.4" />
          </svg>
        </div>
      );
    case "pagina":
      return (
        <div className={`w-32 overflow-hidden ${caja}`}>
          <span className="flex gap-1 border-b border-zinc-100 px-2 py-1.5">
            {["bg-red-300", "bg-amber-300", "bg-emerald-300"].map((color) => (
              <span key={color} className={`h-1.5 w-1.5 rounded-full ${color}`} />
            ))}
          </span>
          <span className="relative block h-9 bg-gradient-to-r from-emerald-500 to-sky-500">
            <svg className="absolute -bottom-3 left-2" width="20" height="24" viewBox="0 0 24 28">
              <path d="M12 1l10 4v8c0 6-4.4 11-10 13C6.4 24 2 19 2 13V5z" fill="#1d4ed8" stroke="white" strokeWidth="2" />
            </svg>
          </span>
          <span className="flex gap-1 p-2 pt-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-4 flex-1 rounded bg-zinc-200" />
            ))}
          </span>
        </div>
      );
    default:
      return null;
  }
}

export async function SeccionPanelYHerramientas() {
  const t = await getTranslations("home");
  const herramientas = t.raw("herramientas.lista") as Herramienta[];
  const metricasPanel = t.raw("panel.metricas") as { numero: string; etiqueta: string }[];
  const tMenu = await getTranslations("panel.menu.enlaces");

  return (
    <section id="herramientas" className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("panel.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
            {t.rich("panel.titulo", { resalte: (trozo) => <span className="text-accion-tinta">{trozo}</span> })}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("panel.texto")}</p>
        </div>

        {/* MAQUETA DEL PANEL DEL CLUB. Las seis cifras son las mismas
            que ve el club en su Inicio, y el menú de la izquierda usa los
            nombres de verdad del menú del panel (`panel.menu.enlaces`):
            si mañana se renombra una sección, la maqueta cambia sola y
            no promete una pantalla que no existe. El menú solo se dibuja
            en pantallas anchas; en el teléfono no cabría y sobra. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-3xl bg-brand-navy-dark shadow-2xl shadow-brand-navy-dark/30 ring-1 ring-white/10 lg:grid lg:grid-cols-[13rem_1fr]"
        >
          <div className="hidden border-r border-white/10 p-5 lg:block">
            <p className="mb-6 px-2 text-xl font-extrabold text-sobre-color">
              Apoya<span className="text-brand-teal">Club</span>
            </p>
            <ul className="flex flex-col gap-1">
              {ENLACES_MAQUETA_PANEL.map(({ clave, icono }, indice) => (
                <li
                  key={clave}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    indice === 0
                      ? "border-l-[3px] border-brand-teal bg-brand-teal-dark font-semibold text-sobre-color"
                      : "text-sobre-color/70"
                  }`}
                >
                  <IconoMaquetaPanel nombre={icono} />
                  {tMenu(clave)}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-extrabold text-sobre-color sm:text-2xl">{t("panel.saludo")}</p>
              <span className="rounded-full bg-brand-teal-dark px-5 py-2.5 text-sm font-bold text-sobre-color">
                {t("panel.boton")}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {metricasPanel.map((metrica, indice) => {
                const estilo = ESTILOS_METRICA_PANEL[indice % ESTILOS_METRICA_PANEL.length];
                return (
                  <div
                    key={metrica.etiqueta}
                    className="flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/5 sm:flex-row sm:items-center sm:p-5"
                  >
                    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl sm:h-14 sm:w-14 ${estilo.fondo}`}>
                      <IconoMaquetaPanel nombre={estilo.icono} grande />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-2xl font-extrabold leading-none text-sobre-color sm:text-3xl">{metrica.numero}</span>
                      <span className="mt-1 block text-xs text-sobre-color/70 sm:text-sm">{metrica.etiqueta}</span>
                    </span>
                    <svg className="hidden flex-none text-sobre-color/50 sm:block" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-sobre-color/40">{t("panel.nota")}</p>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("herramientas.eyebrow")}
          </p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-titular sm:text-4xl">
            {t.rich("herramientas.titulo", { resalte: (trozo) => <span className="text-accion-tinta">{trozo}</span> })}
          </h3>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("herramientas.texto")}</p>
        </div>

        {/* DOCE HERRAMIENTAS, CADA UNA CON SU PÁRRAFO LARGO, ERAN 4.033 px
            en un teléfono: el 21 % de toda la página, más que ninguna
            otra sección. Y no sobraba ninguna herramienta —son las doce
            que trae el plan— sino el párrafo de cada una, que ahí
            seguido se lee como un muro.

            Ahora se ve la línea corta y el párrafo largo se abre al
            pulsar. El texto corto ya estaba escrito (`corto`, el que usa
            la portada), así que no hay nada nuevo que redactar ni nada
            que se pierda: los dos textos siguen en la página, uno a la
            vista y otro a un toque.

            Es `<details>` y no un botón con estado: no necesita
            JavaScript, se abre con el teclado, se puede buscar dentro
            con Ctrl+F y los buscadores leen el texto de dentro aunque
            esté cerrado. */}
        {/* Rejilla de tamaños distintos (12 columnas en el ordenador):
            el dossier en grande, ocupando dos filas, porque es lo que
            más vende; luego dos filas de tres y una de cuatro. Las
            tarjetas que no tienen sitio asignado aquí caen en una de
            cuatro columnas. En el teléfono es una sola columna y los
            dibujos se esconden, salvo el del dossier: ahí la sección
            ya fue una vez la más larga de la página. */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {herramientas.map((herramienta) => (
            <div
              key={herramienta.clave}
              className={`flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 ${
                CELDA_HERRAMIENTA[herramienta.clave] ?? "lg:col-span-3"
              }`}
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
                    <IconoHerramienta clave={herramienta.clave} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className={`block font-extrabold text-titular ${herramienta.clave === "dossier" ? "text-lg" : ""}`}>
                      {herramienta.titulo}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-zinc-600">
                      {herramienta.corto}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-transform group-open:rotate-90"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </summary>

                <p className="mt-3 border-t border-zinc-100 pt-3 text-sm leading-relaxed text-zinc-600">
                  {herramienta.texto}
                </p>
              </details>

              {/* El dibujo de cada herramienta va FUERA del `<details>`:
                  dentro no se vería sin pulsar. El del dossier es la
                  única vez en toda la web que se ve qué pinta tiene un
                  dossier, por eso es el único que sale también en el
                  teléfono. */}
              {herramienta.clave === "dossier" ? (
                <div aria-hidden="true" className="relative mt-6 flex flex-1 items-end justify-center gap-4">
                  <span className="relative">
                    <HojaDeDossier pequena />
                    <span className="absolute -bottom-2 -left-3 rotate-[-8deg] rounded-md bg-peligro px-1.5 py-1 text-[10px] font-extrabold text-sobre-color shadow-md">PDF</span>
                  </span>
                  <span className="relative">
                    <HojaDeDossier pequena segunda />
                    <span className="absolute -bottom-2 -left-3 rotate-[6deg] rounded-md bg-blue-600 px-2 py-1 text-xs font-extrabold text-sobre-color shadow-md">W</span>
                  </span>
                </div>
              ) : (
                <div aria-hidden="true" className="mt-4 hidden flex-1 items-end justify-end sm:flex">
                  <DibujoHerramienta clave={herramienta.clave} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   EL SECTOR
   ============================================================ */

/**
 * El sector, en cifras.
 *
 * Tres datos publicados —no estimaciones nuestras— sobre lo que mueve
 * el patrocinio deportivo. Está justo antes del precio a propósito: que
 * el club lea lo que mueve el mercado y acto seguido vea lo que cuesta
 * estar dentro hace el precio más fácil de entender.
 *
 * Cada tarjeta lleva su fuente y su año escritos. Las cifras caducan —el
 * informe de la ESA sale cada año— y con el año puesto envejecen
 * diciendo la verdad en vez de mintiendo. Cuando salga el informe
 * siguiente, aquí es donde se actualizan.
 */
/** Las banderas, dibujadas a mano dentro de un círculo. No se usan los
 * emoji de bandera (🇪🇸) porque Windows no los pinta: en Chrome sobre
 * Windows salen las dos letras del país en vez de la bandera. */
function Bandera({ pais }: { pais: string }) {
  const id = `bandera-${pais}`;
  const dibujos: Record<string, React.ReactNode> = {
    es: (
      <>
        <rect width="24" height="24" fill="#c60b1e" />
        <rect y="6" width="24" height="12" fill="#ffc400" />
      </>
    ),
    fr: (
      <>
        <rect width="8" height="24" fill="#002395" />
        <rect x="8" width="8" height="24" fill="#fff" />
        <rect x="16" width="8" height="24" fill="#ed2939" />
      </>
    ),
    it: (
      <>
        <rect width="8" height="24" fill="#008c45" />
        <rect x="8" width="8" height="24" fill="#f4f5f0" />
        <rect x="16" width="8" height="24" fill="#cd212a" />
      </>
    ),
    de: (
      <>
        <rect width="24" height="8" fill="#000" />
        <rect y="8" width="24" height="8" fill="#dd0000" />
        <rect y="16" width="24" height="8" fill="#ffce00" />
      </>
    ),
    gb: (
      <>
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="5" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#c8102e" strokeWidth="3" />
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="8" />
        <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4.5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <clipPath id={id}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${id})`}>{dibujos[pais] ?? <rect width="24" height="24" fill="#d4d4d8" />}</g>
    </svg>
  );
}

export async function SeccionSector() {
  const t = await getTranslations("home");

  const paises = t.raw("sector.paises") as {
    clave: string;
    nombre: string;
    anio: string;
    cifra: string;
    insignia: string;
    insigniaPie: string;
    texto: string;
  }[];
  const comparativa = t.raw("sector.comparativa") as {
    titulo: string;
    subtitulo: string;
    barras: { clave: string; nombre: string; cifra: string; valor: number; destacada: boolean }[];
  };
  const europa = t.raw("sector.europa") as {
    titulo: string;
    subtitulo: string;
    porcentaje: number;
    centroCifra: string;
    centroTexto: string;
    texto: string;
    leyenda: { etiqueta: string; cifra: string; porcentaje: string; fuerte: boolean }[];
  };
  const licencias = t.raw("sector.licencias") as {
    titulo: string;
    cifra: string;
    anio: string;
    texto: string;
  };
  const fuentes = t.raw("sector.fuentes") as { quien: string; que: string }[];

  // Las barras se miden contra la más larga, no contra una escala
  // inventada: así la proporción entre países es la real.
  const mayor = Math.max(...comparativa.barras.map((b) => b.valor));

  // El donut: un círculo al que se le pinta sólo un trozo del borde.
  const radio = 42;
  const vuelta = 2 * Math.PI * radio;
  const trozo = (europa.porcentaje / 100) * vuelta;

  return (
    <section className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
          {t("sector.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
          {t("sector.titulo")}
          <br className="hidden sm:block" />{" "}
          <span className="text-accion-tinta">{t("sector.tituloResalte")}</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">{t("sector.subtitulo")}</p>

        {/* Fila 1: un país por tarjeta. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paises.map((pais) => (
            <div
              key={pais.clave}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition-colors hover:border-brand-teal/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-300">
                  <Bandera pais={pais.clave} />
                </span>
                {/* `whitespace-nowrap`: sin esto "2.180 M€" se parte en dos
                    líneas en cuanto la tarjeta se estrecha. */}
                <p className="whitespace-nowrap text-[1.65rem] font-extrabold leading-none tracking-tight text-accion-tinta tabular-nums">
                  {pais.cifra}
                </p>
                <span className="ml-auto shrink-0 rounded-lg bg-brand-teal-light px-2 py-1 text-center">
                  <span className="block whitespace-nowrap text-[13px] font-extrabold leading-tight text-accion-tinta tabular-nums">
                    {pais.insignia}
                  </span>
                  <span className="block whitespace-nowrap text-[13px] leading-tight text-accion-tinta/80">
                    {pais.insigniaPie}
                  </span>
                </span>
              </div>

              <p className="mt-3 font-bold text-titular">{pais.nombre}</p>
              <p className="text-base text-zinc-600">{pais.anio}</p>
              <p className="mt-2.5 text-base leading-relaxed text-zinc-600">{pais.texto}</p>
            </div>
          ))}
        </div>

        {/* Fila 2: la comparativa, el reparto europeo y las licencias. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Comparativa por país */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="font-bold text-titular">{comparativa.titulo}</h3>
            <p className="text-base text-zinc-600">{comparativa.subtitulo}</p>

            <ul className="mt-5 space-y-3">
              {comparativa.barras.map((barra) => (
                <li key={barra.clave} className="flex items-center gap-3">
                  <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-300">
                    <Bandera pais={barra.clave} />
                  </span>
                  <span className="w-24 shrink-0 text-base font-medium text-titular">
                    {barra.nombre}
                  </span>
                  <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200">
                    <span
                      className={`block h-full rounded-full ${
                        barra.destacada ? "bg-brand-teal-dark" : "bg-brand-navy/55"
                      }`}
                      style={{ width: `${(barra.valor / mayor) * 100}%` }}
                    />
                  </span>
                  <span
                    className={`w-20 shrink-0 text-right text-base tabular-nums ${
                      barra.destacada
                        ? "font-extrabold text-accion-tinta"
                        : "font-medium text-zinc-600"
                    }`}
                  >
                    {barra.cifra}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reparto del patrocinio europeo */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="font-bold text-titular">{europa.titulo}</h3>
            <p className="text-base text-zinc-600">{europa.subtitulo}</p>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r={radio}
                    fill="none"
                    stroke="var(--color-brand-navy)"
                    strokeOpacity="0.2"
                    strokeWidth="14"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radio}
                    fill="none"
                    stroke="var(--color-brand-teal-dark)"
                    strokeWidth="14"
                    strokeDasharray={`${trozo} ${vuelta - trozo}`}
                    strokeLinecap="butt"
                  />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold leading-none text-titular tabular-nums">
                    {europa.porcentaje} %
                  </span>
                  <span className="mt-1 text-[13px] leading-tight text-zinc-600">
                    {europa.centroTexto}
                  </span>
                </span>
              </div>

              <ul className="min-w-0 space-y-2.5 text-sm">
                {europa.leyenda.map((fila) => (
                  <li key={fila.etiqueta}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          fila.fuerte ? "bg-brand-teal-dark" : "bg-brand-navy/20"
                        }`}
                      />
                      <span className="font-medium text-titular">{fila.etiqueta}</span>
                    </span>
                    <span className="ml-4.5 block text-zinc-600 tabular-nums">
                      {fila.cifra} ({fila.porcentaje})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-base leading-relaxed text-zinc-600">{europa.texto}</p>
          </div>

          {/* Licencias federativas */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
              </svg>
            </span>
            <h3 className="mt-4 font-bold text-titular">{licencias.titulo}</h3>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-accion-tinta tabular-nums">
              {licencias.cifra}
            </p>
            <p className="text-base text-zinc-600">{licencias.anio}</p>
            <p className="mt-2.5 text-base leading-relaxed text-zinc-600">{licencias.texto}</p>
          </div>
        </div>

        {/* Las fuentes, al pie y completas: es lo que sostiene la sección. */}
        <dl className="mt-6 grid gap-x-8 gap-y-2 border-t border-zinc-200 pt-5 text-[13px] leading-relaxed text-zinc-600 sm:grid-cols-2">
          {fuentes.map((fuente) => (
            <div key={fuente.quien}>
              <dt className="inline font-semibold text-zinc-600">{fuente.quien}: </dt>
              <dd className="inline">{fuente.que}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ============================================================
   PRECIO
   ============================================================ */

/** Los tres planes salen de `lib/planes.ts`, que es de donde los leen
 * también la página de suscripción, el área financiera y Stripe. Si
 * estuvieran escritos aquí a mano, el día que suba el precio la portada
 * seguiría enseñando el viejo.
 *
 * `compacta` es la versión de la portada: los tres precios y poco más.
 * La lista de todo lo que incluye es larga y quien está comparando de
 * verdad ya ha entrado en la página de clubes. */
/** Los iconos de la franja de abajo del precio. */
const ICONO_DE_LA_FRANJA: Record<string, React.ReactNode> = {
  cubre: (
    <>
      <path d="M3 17l5-5 3.5 3.5L20 7" />
      <path d="M20 12V7h-5" />
    </>
  ),
  renueva: (
    <>
      <path d="M20.5 11.5a8.5 8.5 0 00-15.2-5.2M3.5 12.5a8.5 8.5 0 0015.2 5.2" />
      <path d="M20.5 5.5v6h-6M3.5 18.5v-6h6" />
    </>
  ),
  segura: (
    <>
      <path d="M12 3l7 3v5.5c0 4.3-3 8-7 9.5-4-1.5-7-5.2-7-9.5V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

/**
 * La nota al margen, escrita a mano.
 *
 * Solo a partir de `lg`. En un teléfono las tres tarjetas van una
 * debajo de otra y no hay margen donde ponerla: acabaría de pie
 * forzado encima del título, sumando una frase más a una pantalla que
 * ya tiene bastante texto.
 *
 * `aria-hidden` en la flecha y no en la frase: la frase dice algo y un
 * lector de pantalla debe leerla; la flecha solo señala.
 */
function NotaDelPrecio({ texto }: { texto: string }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 hidden w-60 select-none lg:block xl:w-64">
      {/* `--font-mano` es la variable que pone next/font en el <html>.
          No se pasa por un token de `@theme inline`, porque ese modo
          mete los valores dentro de las utilidades y no publica la
          variable: `var(...)` llegaba vacía y la frase salía en la
          tipografía de los titulares. */}
      <p className="text-right text-[1.6rem] leading-tight text-titular [font-family:var(--font-mano),'Segoe_Script','Bradley_Hand',cursive] xl:text-3xl">
        {texto}
      </p>
      <svg
        aria-hidden="true"
        viewBox="0 0 120 90"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto mt-2 h-16 w-28 text-titular"
      >
        <path d="M108 8c4 30-12 58-44 70" />
        <path d="M80 76l-16 2 4-16" />
      </svg>
    </div>
  );
}

/**
 * La franja de tres razones, debajo de los planes.
 *
 * Tampoco sale en el teléfono. Ahí la sección ya son tres tarjetas de
 * plan apiladas, y añadir tres bloques más de texto detrás es pedirle
 * a alguien que lea seis cosas seguidas en una pantalla de 6 pulgadas
 * para decidir una compra de 29,90 €. En el ordenador caben en una
 * fila y se leen de un vistazo, que es justo cuando ayudan.
 */
function FranjaDelPrecio({
  bloques,
}: {
  bloques: { clave: string; titulo: string; texto: string }[];
}) {
  return (
    <div className="mt-12 hidden rounded-3xl border border-zinc-200 bg-white/80 p-8 backdrop-blur-sm lg:grid lg:grid-cols-3 lg:gap-8">
      {bloques.map((bloque) => (
        <div key={bloque.clave} className="flex gap-4">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-teal-light text-accion-tinta">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              {ICONO_DE_LA_FRANJA[bloque.clave] ?? ICONO_POR_DEFECTO}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-extrabold leading-snug text-titular">{bloque.titulo}</p>
            <p className="mt-1.5 text-base leading-relaxed text-zinc-600">{bloque.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function SeccionPrecio({ compacta = false }: { compacta?: boolean }) {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as AppLocale;
  const formatoPlan = new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
  const ventajas = t.raw("precio.ventajas") as string[];
  const franja = t.raw("precio.franja") as { clave: string; titulo: string; texto: string }[];

  return (
    <section
      id="precio"
      className="relative scroll-mt-32 overflow-hidden bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28"
    >
      {/* La foto del campo, muy apagada y desvanecida por arriba y por
          abajo. Las tarjetas son blancas y van encima: si la foto
          pesara más, los precios dejarían de leerse, que es lo único
          que esta sección tiene que conseguir. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          src="/fondo-precio.webp"
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-zinc-50/60" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-zinc-50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <NotaDelPrecio texto={t("precio.nota")} />

        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("precio.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
            {t("precio.titulo")}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{t("precio.subtitulo")}</p>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {PLANES_EN_ORDEN.map((plan) => {
            const idPlan = plan.id;
            return (
            <div
              key={plan.id}
              className={`flex h-full flex-col rounded-3xl bg-white p-8 ${
                plan.destacado
                  ? "border-2 border-brand-teal shadow-xl shadow-brand-teal/15"
                  : "border border-zinc-200 shadow-sm"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
                  {t(`planes.${idPlan}.nombre`)}
                </p>
                {plan.limitado && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[13px] font-bold text-amber-800">
                    {t("precio.plazasFundador")}
                  </span>
                )}
              </div>

              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-titular">
                  {formatoPlan.format(plan.precioCentimos / 100)}
                </span>{" "}
                <span className="text-base text-zinc-600">
                  {plan.intervalo === "mes" ? t("planes.alMes") : t("planes.alAnio")}
                </span>
              </p>

              <p className="mt-2 text-base font-medium text-zinc-800">{t(`planes.${idPlan}.reclamo`)}</p>
              <p className="mt-2 text-base leading-relaxed text-zinc-600">{t(`planes.${idPlan}.detalle`)}</p>

              <Link
                href="/registro-club"
                className={`mt-auto inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-bold transition-colors ${
                  plan.destacado
                    ? "bg-brand-teal-dark text-sobre-color shadow-lg shadow-brand-teal/30 hover:bg-brand-navy"
                    : "border border-zinc-300 text-titular hover:bg-zinc-50"
                }`}
              >
                {t("precio.cta")}
              </Link>
            </div>
            );
          })}
        </div>

        {/* Tres líneas de letra pequeña, una debajo de otra, no se leen:
            se saltan. En la portada van resumidas en una. */}
        {/* `lg:hidden`: a partir de ahí lo dice la tercera tarjeta de la
            franja de abajo, y repetir las mismas condiciones dos veces
            en el mismo pantallazo las hace menos creíbles, no más. */}
        <div className="lg:hidden">
          {compacta ? (
            <p className="mt-7 text-center text-base text-zinc-600">
              {t("precio.resumenCondiciones")}
            </p>
          ) : (
            <>
              <p className="mt-7 text-center text-base text-zinc-600">
                {t("precio.gratisPrimerMes")}
              </p>
              <p className="mt-1 text-center text-base text-zinc-600">{t("precio.cancelar")}</p>
              <p className="mt-1 text-center text-base text-zinc-600">{t("precio.comision")}</p>
            </>
          )}
        </div>

        <FranjaDelPrecio bloques={franja} />

        {!compacta && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-titular">
              {t("precio.todoIncluye")}
            </p>
            <div className="mt-7 grid gap-3.5 text-left sm:grid-cols-2">
              {ventajas.map((ventaja) => (
                <div key={ventaja} className="flex items-center gap-2.5">
                  <Tic className="flex-none text-brand-teal" tamano={17} />
                  <span className="text-base font-medium text-zinc-700">{ventaja}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PREGUNTAS FRECUENTES
   ============================================================ */

/** `limite` recorta la lista para la portada. El aviso de fiscalidad va
 * siempre: no es adorno, es lo que evita que un club crea que aquí se
 * le resuelve la declaración. */
export async function SeccionFaq({ limite }: { limite?: number } = {}) {
  const t = await getTranslations("home");
  const todas = t.raw("faq.preguntas") as { pregunta: string; respuesta: string }[];
  const preguntas = limite ? todas.slice(0, limite) : todas;
  const hayMas = preguntas.length < todas.length;

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
        {t("faq.titulo")}
      </h2>

      <div className="mt-12 space-y-3">
        {preguntas.map((item) => (
          <details
            key={item.pregunta}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 open:border-brand-teal/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-titular marker:content-none">
              {item.pregunta}
              <span className="flex-none text-zinc-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.respuesta}</p>
          </details>
        ))}
      </div>

      {hayMas && (
        <p className="mt-6 text-center">
          <Link
            href="/para-clubes#faq"
            className="text-sm font-bold text-accion-tinta underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
          >
            {t("faq.verTodas")}
          </Link>
        </p>
      )}

      {/* Fiscalidad: aviso de que no se ofrece asesoramiento fiscal */}
      <div
        role="alert"
        className="mt-8 flex gap-3.5 rounded-2xl border border-amber-200 bg-amber-50 p-6"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-100">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#92400e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-amber-900">{t("faq.fiscalidadTitulo")}</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            {t.rich("faq.fiscalidadTexto", {
              fuerte: (contenido) => <strong>{contenido}</strong>,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA FINAL Y CONTACTO
   ============================================================ */

export async function SeccionCtaFinal() {
  const t = await getTranslations("home");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navy-dark px-4 py-24 text-center sm:px-6 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-teal/15 blur-3xl"
      />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-3xl font-extrabold leading-tight text-sobre-color sm:text-4xl">
          {t("ctaFinal.tituloLinea1")}
          <br />
          {t("ctaFinal.tituloLinea2")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sobre-color/80">
          {t("ctaFinal.subtexto")}
        </p>
        <Link
          href="/registro-club"
          className="mt-9 inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-sobre-color shadow-lg shadow-brand-teal/40 transition-colors hover:bg-brand-teal"
        >
          {t("ctaFinal.cta")}
        </Link>
        <p className="mt-4 text-base text-sobre-color/75">{t("ctaFinal.condiciones")}</p>
      </div>
    </section>
  );
}

export async function SeccionContacto() {
  const t = await getTranslations("home");

  return (
    <section id="contacto" className="mx-auto max-w-xl px-4 py-20 sm:px-6 sm:py-28">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
        {t("contacto.titulo")}
      </h2>
      <p className="mt-3 text-center text-zinc-600">{t("contacto.texto")}</p>

      <div className="mt-9 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <FormularioContacto />
      </div>
    </section>
  );
}

/* ============================================================
   EL VÍDEO
   ============================================================ */

/**
 * Dónde está el vídeo, dentro de `public/`. Una sola línea, a
 * propósito: el día que haya vídeo se cambia el `null` por
 * `"/apoyaclub-en-un-minuto.mp4"` y la sección aparece sola.
 *
 * Y mientras no lo haya, la sección no se pinta. Un recuadro vacío con
 * un triángulo de "play" que no reproduce nada es peor que no tener
 * vídeo: el visitante pulsa, no pasa nada, y lo que aprende es que la
 * web está a medio hacer.
 */
const VIDEO_DEL_PRODUCTO: string | null = null;

export async function SeccionVideo() {
  if (!VIDEO_DEL_PRODUCTO) return null;

  const t = await getTranslations("home");

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
          {t("video.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
          {t("video.titulo")}
        </h2>
        <p className="mt-4 leading-relaxed text-zinc-600">{t("video.texto")}</p>
      </div>

      {/* `preload="metadata"` y no `auto`: un vídeo de un minuto son
          varios megas, y la mayoría de quien entra no le va a dar al
          play. Que no los pague por adelantado, sobre todo con datos
          del móvil. */}
      <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-xl shadow-brand-navy/15">
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video h-auto w-full max-w-full"
        >
          <source src={VIDEO_DEL_PRODUCTO} type="video/mp4" />
          {t("video.alternativa")}
        </video>
      </div>
    </section>
  );
}

/* ============================================================
   LAS SEIS HERRAMIENTAS
   ============================================================ */

/**
 * Las seis herramientas de la portada, y el aviso de que hay más.
 *
 * Aquí había antes un bloque de cuatro pantallas en pestañas —tu
 * página, tus oportunidades, quién te escribe, tu dossier— y se quitó
 * al llegar estas: cuatro de aquellas pestañas eran cuatro de estas
 * seis herramientas, contadas dos veces en la misma sección.
 *
 * Un club que se plantea pagar quiere saber qué hay dentro, y la
 * respuesta honesta —doce herramientas— no cabe en una portada de seis
 * bloques. Seis aquí, con su nombre y una línea, y las otras seis
 * nombradas en una frase debajo. El club se lleva la idea correcta
 * ("hay bastante más de lo que estoy viendo") sin tener que leerse las
 * doce, y quien quiera las doce tiene el enlace.
 *
 * Las seis no son "las mejores": son las del recorrido de un club.
 * Montas tu página, publicas tus oportunidades, te escriben, cumples lo
 * prometido, mandas el dossier y demuestras lo hecho. En ese orden, que
 * es el de la vida real y el que hace que se entiendan entre ellas.
 *
 * Cuáles son las seis se decide en `messages`, no aquí: la lista de
 * claves vive junto a los textos, que es donde alguien va a buscarla.
 */
export async function SeccionHerramientasClave() {
  const t = await getTranslations("home");
  const todas = t.raw("herramientas.lista") as Herramienta[];
  const claves = t.raw("herramientas.destacadas") as string[];

  // Se respeta el orden de `destacadas`, no el de la lista larga: ahí
  // está el recorrido. Y si una clave no existe —por un cambio de
  // nombre— se cae de la portada en silencio en vez de pintar un hueco.
  const destacadas = claves
    .map((clave) => todas.find((herramienta) => herramienta.clave === clave))
    .filter((herramienta): herramienta is Herramienta => herramienta !== undefined);

  const cuantasMas = todas.length - destacadas.length;

  /* Un campo azul marino entero: a la izquierda el titular y lo que
     significa, a la derecha las seis tarjetas blancas con su dibujo. El
     cambio de color separa esta sección de las dos claras que la rodean,
     y las tarjetas blancas resaltan encima. La etiqueta "Todo incluido" de encima del
     titular se queda: Rafael prefiere las etiquetas en mayúsculas, que
     en el teléfono ahorran una línea de texto. */
  return (
    <section id="herramientas" className="scroll-mt-32 bg-brand-navy px-4 py-20 sm:px-6 sm:py-28">
      {/* Tres piezas en una rejilla: en el ordenador, el titular y el
          "y hay más" a la izquierda y las tarjetas a la derecha; en el
          teléfono, titular, tarjetas y al final el "y hay más", para no
          tener dos párrafos seguidos antes de ver ninguna herramienta. */}
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16 lg:gap-y-8">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-light">
            {t("herramientas.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-sobre-color sm:text-4xl">
            {t.rich("herramientas.titulo", { resalte: (trozo) => <span className="text-brand-teal-light">{trozo}</span> })}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-sobre-color/85">
            {t("herramientas.texto")}
          </p>
        </div>

        {/* Las seis, en sus tarjetas blancas con el dibujo de siempre,
            encima del azul: así resaltan y se reconocen de un vistazo. */}
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {destacadas.map((herramienta) => (
            <div
              key={herramienta.clave}
              className="flex gap-4 rounded-2xl bg-white p-5"
            >
              <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
                <IconoHerramienta clave={herramienta.clave} />
              </span>
              <div>
                <h3 className="font-extrabold leading-snug text-titular">
                  {herramienta.titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{herramienta.corto}</p>
              </div>
            </div>
          ))}
        </div>

          {/* El "y hay más". El número sale de la resta, no escrito a
              mano: el día que se añada una herramienta, la portada lo
              dice sola. */}
          {cuantasMas > 0 && (
            <div className="max-w-md lg:col-start-1 lg:row-start-2">
              <p className="text-base leading-relaxed text-sobre-color/75">
                {t("herramientas.hayMas", { cuantas: cuantasMas })}
              </p>
              <Link
                href="/para-clubes#herramientas"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-teal-dark px-6 py-3 text-base font-bold text-sobre-color transition-colors hover:bg-brand-teal"
              >
                {t("herramientas.verTodas", { total: todas.length })}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
      </div>
    </section>
  );
}

/* ============================================================
   LAS CUATRO FUNCIONES DEL HERO
   ============================================================ */

/**
 * "Más de 100" a partir de 112, y "más de 10" a partir de 14.
 *
 * Se redondea hacia abajo al escalón anterior, nunca al más cercano:
 * "más de 100" con 112 ideas es verdad; "más de 120" no lo sería. Y se
 * resta uno antes de redondear para el caso en que el total caiga justo
 * en el escalón — con 100 ideas clavadas, "más de 100" es mentira.
 *
 * Si redondear deja el número por debajo del primer escalón (menos de
 * 100 ideas, menos de 10 categorías), no hay redondeo que valga y se
 * dice la cifra exacta.
 */
function masDe(total: number, escalon: number): number {
  const redondeado = Math.floor((total - 1) / escalon) * escalon;
  return redondeado >= escalon ? redondeado : total;
}

/**
 * Cuatro cosas que hace ApoyaClub, debajo del titular.
 *
 * El titular dice que tu club tiene algo que ofrecer y que aquí lo
 * descubres y lo gestionas. Eso es la promesa; estas cuatro son la
 * prueba. Sin ellas ApoyaClub podría ser un listado, una agencia o un
 * curso, y quien entra no tiene forma de saberlo hasta que baja media
 * página.
 *
 * Son pastillas y no un párrafo a propósito: se escanean en medio
 * segundo. Aquí había antes una línea en prosa que enumeraba lo mismo
 * —"patrocinadores, colaboradores, servicios y oportunidades"— y se
 * quitó: dos listas seguidas de las mismas cosas no convencen el
 * doble, cansan.
 *
 * Son cuatro y no ocho a propósito. Una fila de ocho pastillas vuelve a
 * ser el muro de texto que el hero intenta no ser, y la lista completa
 * ya está en /para-clubes.
 *
 * Los números salen del catálogo (`TOTAL_DE_IDEAS` y
 * `CATEGORIAS_IDEA`), no escritos a mano. Una cifra a mano en una
 * portada es una cifra que un día miente: el catálogo crece y nadie se
 * acuerda de volver aquí. Y se dicen redondeados hacia abajo —"más de
 * 100", "más de 10"— porque con 112 ideas eso es verdad hoy y lo
 * seguirá siendo mañana, pase lo que pase con el catálogo.
 *
 * El ancho (`max-w-4xl`) está puesto para que caigan en 2 + 2, que es
 * la única forma equilibrada con estos cuatro textos. Medido: a 3xl
 * salen 1 + 2 + 1 y a 5xl vuelven a ser 2 + 2, así que 4xl es el
 * mínimo que funciona. Si se cambia un texto hay que volver a mirarlo:
 * una pastilla suelta al final se lee como un descuido, no como un
 * énfasis.
 */
export async function FuncionesDestacadas({ enColumna = false }: { enColumna?: boolean }) {
  const t = await getTranslations("home");

  const funciones = [
    {
      clave: "ideas",
      titulo: t("funciones.ideasTitulo", { ideas: masDe(TOTAL_DE_IDEAS, 100) }),
      detalle: t("funciones.ideasDetalle", { categorias: masDe(CATEGORIAS_IDEA.length, 10) }),
    },
    { clave: "empresas", titulo: t("funciones.empresasTitulo"), detalle: t("funciones.empresasDetalle") },
    { clave: "tareas", titulo: t("funciones.tareasTitulo"), detalle: t("funciones.tareasDetalle") },
    { clave: "dossier", titulo: t("funciones.dossierTitulo"), detalle: t("funciones.dossierDetalle") },
  ];

  return (
    /* Cuatro en fila cuando ocupa el ancho entero; de dos en dos
       cuando vive en la columna del héroe, al lado del vídeo. En
       media pantalla, cuatro columnas dejan a "Más de 100 ideas de
       patrocinio" en cinco líneas. */
    <ul
      className={`mt-9 grid gap-x-6 gap-y-5 text-left sm:grid-cols-2 ${
        enColumna ? "max-w-none" : "mx-auto max-w-4xl lg:grid-cols-4"
      }`}
    >
      {funciones.map((funcion) => (
        <li key={funcion.clave} className="flex items-start gap-3">
          {/* El icono en su cuadrado de color, que es lo que hace que
              la fila se escanee sin leerla: primero se ven cuatro
              marcas, y solo después el texto de la que interesa. */}
          <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
            <IconoHerramienta clave={funcion.clave} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-bold leading-snug text-titular">
              {funcion.titulo}
            </span>
            {/* zinc-600 y no zinc-500: estas dos líneas caen encima de
                la foto del fondo, y el gris más claro se quedaba corto
                de contraste justo donde la imagen se ve más. */}
            <span className="mt-0.5 block text-[12.5px] leading-snug text-zinc-600">
              {funcion.detalle}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Las dos puertas del hero: club o empresa.
 *
 * Eran dos tarjetas grandes con rótulo, titular, párrafo, botón,
 * condiciones y un enlace de atajo — catorce líneas de texto para una
 * pregunta de una palabra. Lo primero que hay que resolver al entrar no
 * es convencer a nadie: es saber cuál de los dos eres, y para eso
 * sobra todo menos el botón.
 *
 * El detalle de cada lado no se ha perdido: está entero en
 * `/para-clubes` y `/para-empresas`, que es justo a donde llevan.
 */
export async function PuertasDelHero({ enColumna = false }: { enColumna?: boolean }) {
  const t = await getTranslations("home");

  const puertas = [
    {
      href: "/para-clubes",
      cta: t("puertas.clubCta"),
      pie: t("puertas.clubPie"),
      clases:
        "bg-brand-teal-dark text-sobre-color hover:bg-brand-teal focus-visible:outline-accion-tinta",
    },
    {
      href: "/para-empresas",
      cta: t("puertas.empresaCta"),
      pie: t("puertas.empresaPie"),
      clases:
        "border-2 border-titular bg-white text-titular hover:bg-brand-navy hover:text-sobre-color",
    },
  ] as const;

  return (
    <div
      className={`mt-10 grid gap-5 sm:grid-cols-2 ${enColumna ? "max-w-none" : "mx-auto max-w-3xl"}`}
    >
      {puertas.map((puerta) => (
        <div key={puerta.href}>
          <Link
            href={puerta.href}
            className={`group flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-bold transition-colors sm:text-lg ${puerta.clases}`}
          >
            {puerta.cta}
            {/* La flecha se mueve al pasar por encima: es lo que
                distingue un botón de una caja de color. */}
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <p
            className={`mt-2.5 text-[15px] leading-snug text-zinc-600 ${
              enColumna ? "text-center lg:text-left" : "text-center"
            }`}
          >
            {puerta.pie}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PIEZAS SUELTAS
   ============================================================ */

/** Una casilla del buscador de empresas: la pregunta y la respuesta. */
function CasillaFiltro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 px-5 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{etiqueta}</div>
      <div className="mt-0.5 text-base font-bold text-titular">{valor}</div>
    </div>
  );
}

/** Hoja del dossier: líneas grises, sin texto inventado. */
/** `pequena` es la que va dentro de la tarjeta de la herramienta, que
 * tiene un tercio del ancho que tenía la sección suelta de antes. */
function HojaDeDossier({
  segunda = false,
  pequena = false,
}: {
  segunda?: boolean;
  pequena?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex-none rounded-xl border border-zinc-200 bg-white p-4 shadow-xl shadow-brand-navy/10 ${
        pequena ? "w-28" : "w-36 sm:w-44"
      } ${segunda ? "mt-8 rotate-2" : "-rotate-2"}`}
    >
      <div className="mb-3 h-2 w-3/5 rounded bg-brand-navy" />
      <div className="mb-1.5 h-1 w-full rounded bg-zinc-200" />
      <div className="mb-1.5 h-1 w-11/12 rounded bg-zinc-200" />
      <div className="mb-4 h-1 w-full rounded bg-zinc-200" />
      <div className={`mb-4 rounded ${segunda ? "h-12 bg-brand-navy/10" : "h-16 bg-brand-teal-light"}`} />
      <div className="mb-1.5 h-1 w-4/5 rounded bg-zinc-200" />
      <div className="mb-1.5 h-1 w-full rounded bg-zinc-200" />
      <div className="h-1 w-5/6 rounded bg-zinc-200" />
    </div>
  );
}

/** La marca de verificación, que aparece en tres listas distintas. */
export function Tic({ className, tamano = 16 }: { className?: string; tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
