import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIAS_IDEA, TOTAL_DE_IDEAS } from "@/lib/catalogo-ideas";
import { PLANES_EN_ORDEN, periodicidad, precioFormateado } from "@/lib/planes";
import { FormularioContacto } from "./FormularioContacto";

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
const PANTALLA_DEL_PASO: Record<string, { archivo: string; alt: string }> = {
  CREA: {
    archivo: "/paso-perfil.webp",
    alt: "La ficha del club en ApoyaClub, con sus apartados: identidad, equipos, instalaciones, cantera.",
  },
  PUBLICA: {
    archivo: "/paso-oportunidades.webp",
    alt: "La pantalla de oportunidades, con el catálogo de ideas por categorías abierto.",
  },
  CONTACTA: {
    archivo: "/paso-solicitudes.webp",
    alt: "La bandeja de solicitudes, con el mensaje de una empresa y su estado.",
  },
  CRECE: {
    archivo: "/paso-tareas.webp",
    alt: "Las tareas con cada patrocinador, con sus fechas y el botón de generar el informe.",
  },
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
  const pasos = t.raw("comoFunciona.pasos") as (TextoConTitulo & { clave: string })[];

  return (
    <section id="como-funciona" className="scroll-mt-32 bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("comoFunciona.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
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
                  <p className="mt-3 text-sm font-extrabold uppercase tracking-wider text-brand-teal-dark">
                    {paso.clave}
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold leading-snug text-brand-navy">
                    {paso.titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
                    {paso.texto}
                  </p>
                </div>

                {pantalla && (
                  <div className={invertido ? "lg:order-1" : undefined}>
                    <Portatil archivo={pantalla.archivo} alt={pantalla.alt} />
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
        <p className="mt-12 text-center text-xs text-zinc-500">
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
  const queOfrece = t.raw("ofrece.tarjetas") as string[];

  return (
    <section id="clubes" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
          {t("ofrece.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl">
          {t("ofrece.titulo")}
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {queOfrece.map((cosa) => (
          <div
            key={cosa}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-5 text-center shadow-sm transition-colors hover:border-brand-teal/50"
          >
            <span className="text-sm font-bold text-brand-navy sm:text-[15px]">{cosa}</span>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-xl font-extrabold leading-snug text-brand-navy sm:text-2xl">
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
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t("oportunidades.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-white/70">{t("oportunidades.texto")}</p>
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
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-brand-navy">
                  {oportunidad.titulo}
                </h3>

                <p className="mt-3">
                  <span className="text-3xl font-extrabold tracking-tight text-brand-navy">
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

                <span className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-brand-navy px-6 py-3.5 text-sm font-bold text-white">
                  {oportunidad.cta}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/50">{t("oportunidades.nota")}</p>
      </div>
    </section>
  );
}

/* ============================================================
   LA PÁGINA DEL CLUB
   ============================================================ */

export async function SeccionPaginaClub() {
  const t = await getTranslations("home");

  return (
    <section
      id="tu-pagina"
      className="mx-auto grid max-w-6xl scroll-mt-32 items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.85fr_1.15fr]"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
          {t("paginaClub.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl">
          {t("paginaClub.titulo")}
        </h2>
        <p className="mt-5 leading-relaxed text-zinc-600">{t("paginaClub.texto")}</p>
        <p className="mt-4 leading-relaxed text-zinc-600">{t("paginaClub.texto2")}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-brand-navy/10">
        <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" aria-hidden="true" />
          <span className="ml-2 truncate text-xs text-zinc-500">{t("paginaClub.maqueta.url")}</span>
        </div>
        <div className="h-32 bg-gradient-to-br from-brand-navy to-brand-teal-dark" />
        <div className="px-6">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-md">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--brand-teal-dark)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
            </svg>
          </div>
        </div>
        <div className="px-6 pb-6 pt-3.5">
          <div className="text-[17px] font-extrabold text-brand-navy">
            {t("paginaClub.maqueta.nombre")}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="teal">{t("paginaClub.maqueta.etiqueta1")}</Badge>
            <Badge tone="teal">{t("paginaClub.maqueta.etiqueta2")}</Badge>
            <Badge tone="neutral">{t("paginaClub.maqueta.etiqueta3")}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2.5 border-t border-zinc-100 pt-4">
            <DatoMaqueta numero="12,4k" etiqueta={t("paginaClub.maqueta.seguidores")} />
            <DatoMaqueta numero="48k" etiqueta={t("paginaClub.maqueta.alcance")} />
            <DatoMaqueta numero="9" etiqueta={t("paginaClub.maqueta.equipos")} />
            <DatoMaqueta numero="3" etiqueta={t("paginaClub.maqueta.oportunidades")} />
          </div>
        </div>
      </div>
    </section>
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
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM20 20v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 5.2a3.25 3.25 0 010 6.1" />
    </>
  ),
  reputacion: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
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

/**
 * Por qué a una empresa le interesa, y los números del sector que lo
 * sostienen.
 *
 * Va justo debajo de la portada de /para-empresas: quien acaba de
 * pulsar "soy una empresa" todavía no sabe por qué debería seguir
 * leyendo, y esto se lo dice antes que ninguna otra cosa.
 *
 * Un aviso para quien toque esto después. La maqueta de la que salió
 * esta sección traía un porcentaje con fuente en cada tarjeta —"el 77 %
 * de los consumidores...", Nielsen; "el 85 %...", Cone Communications;
 * "hasta un 40 % de deducción fiscal", Ley 49/2002—. Ninguno se pudo
 * verificar, el último era directamente falso (el 40 % es de los
 * donativos, no del patrocinio, que es un gasto de publicidad) y el
 * estudio de Cone que se citaba como de 2023 es de 2017. Las tarjetas
 * se quedaron con el argumento y sin el número.
 *
 * Las tres cifras de la franja sí están comprobadas y llevan su fuente
 * con el año del dato. Si se añade una cuarta, que venga con lo mismo.
 */
export async function SeccionBeneficiosEmpresa() {
  const t = await getTranslations("home");
  const tarjetas = t.raw("paraEmpresas.beneficios.tarjetas") as {
    clave: string;
    titulo: string;
    texto: string;
    aviso?: string;
  }[];
  const franja = t.raw("paraEmpresas.beneficios.franja") as {
    clave: string;
    cifra: string;
    que: string;
    fuente: string;
  }[];

  return (
    <section
      id="beneficios"
      className="scroll-mt-32 border-b border-zinc-200 bg-white px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("paraEmpresas.beneficios.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("paraEmpresas.beneficios.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">
            {t("paraEmpresas.beneficios.subtitulo")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tarjetas.map((tarjeta) => (
            <div
              key={tarjeta.clave}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition-colors hover:border-brand-teal/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  {ICONO_DEL_BENEFICIO[tarjeta.clave] ?? ICONO_POR_DEFECTO}
                </svg>
              </span>

              <h3 className="mt-4 font-extrabold text-brand-navy">{tarjeta.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{tarjeta.texto}</p>

              {/* La única tarjeta con letra pequeña, y la lleva por un
                  motivo: es la que habla de impuestos. */}
              {tarjeta.aviso ? (
                <p className="mt-3 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500">
                  {tarjeta.aviso}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* La franja de cifras, sobre la foto. Es un titular y no una
            cita entre comillas: una frase entrecomillada sin nadie que
            la firme parece el testimonio de alguien, y aquí no lo dice
            nadie más que la propia web. */}
        <div className="relative isolate mt-6 overflow-hidden rounded-3xl bg-brand-navy p-8 sm:p-10">
          <Image
            src="/fondo-beneficios.webp"
            alt=""
            fill
            loading="lazy"
            sizes="(min-width: 1152px) 1152px, 100vw"
            aria-hidden="true"
            className="-z-10 object-cover object-center opacity-45"
          />
          {/* El velo azul va por encima de la foto y por debajo del
              texto: sin él, las cifras en blanco caen sobre el cielo
              naranja del atardecer y dejan de leerse. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand-navy/55" />

          <h3 className="max-w-2xl text-xl font-extrabold leading-snug text-white sm:text-2xl">
            {t("paraEmpresas.beneficios.franjaTitulo")}
          </h3>

          <dl className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {franja.map((dato) => (
              <div key={dato.clave}>
                <dt className="text-2xl font-extrabold tracking-tight text-brand-teal-light tabular-nums">
                  {dato.cifra}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-white/85">{dato.que}</dd>
                {dato.fuente ? (
                  <dd className="mt-2 text-[11px] leading-relaxed text-white/55">{dato.fuente}</dd>
                ) : null}
              </div>
            ))}
          </dl>
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
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("empresas.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
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

          <span className="mt-5 flex w-full items-center justify-center rounded-2xl bg-brand-teal-dark px-6 py-4 text-base font-bold text-white">
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
              <h3 className="text-[15px] font-bold leading-snug text-brand-navy">
                {resultado.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{resultado.texto}</p>
              <div className="mt-4 text-xl font-extrabold text-brand-navy">{resultado.precio}</div>
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

  return (
    <section id="seguimiento" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
          {t("embudo.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl">
          {t("embudo.titulo")}
        </h2>
        <p className="mt-4 leading-relaxed text-zinc-600">{t("embudo.texto")}</p>
      </div>

      {/* Sin esta línea, las cuatro casillas son cuatro palabras
          sueltas: nadie sabe si hay que elegir una, si son opciones o
          si van en orden. */}
      <p className="mt-10 text-center text-sm font-semibold text-brand-navy">
        {t("embudo.comoSeLee")}
      </p>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {estadosEmbudo.map((estado, indice) => (
          <li
            key={estado.nombre}
            className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal-light text-sm font-extrabold text-brand-teal-dark">
              {indice + 1}
            </span>
            <h3 className="mt-4 font-extrabold text-brand-navy">{estado.nombre}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{estado.texto}</p>

            {/* La flecha entre casillas solo tiene sentido cuando van en
                fila; apiladas en el móvil sobra. */}
            {indice < estadosEmbudo.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-zinc-300 lg:block"
              >
                <svg width="18" height="12" viewBox="0 0 24 14" fill="none">
                  <path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* En blanco y con borde, como las cuatro casillas de arriba.
          Era `bg-zinc-50`, que funcionaba cuando el fondo de la página
          era blanco; desde que el fondo es el lienzo —del mismo tono—
          esta caja desaparecía del todo. */}
      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-center">
        <span className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-500">
          {t("embudo.descartada")}
        </span>
        <span className="text-sm leading-relaxed text-zinc-600">{t("embudo.descartadaTexto")}</span>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] font-medium leading-relaxed text-brand-navy sm:text-base">
        {t("embudo.cierre")}
      </p>
    </section>
  );
}

/* ============================================================
   DOSSIER
   ============================================================ */

export async function SeccionDossier() {
  const t = await getTranslations("home");

  return (
    <section className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("dossier.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl">
            {t("dossier.titulo")}
          </h2>
          <p className="mt-5 leading-relaxed text-zinc-600">{t("dossier.texto")}</p>
          <span className="mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-brand-navy px-7 py-4 text-base font-bold text-white">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
            </svg>
            {t("dossier.boton")}
          </span>
        </div>

        {/* Maqueta de las dos primeras hojas del dossier. */}
        <div className="flex justify-center gap-5">
          <HojaDeDossier />
          <HojaDeDossier segunda />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   EL PANEL Y LAS HERRAMIENTAS
   ============================================================ */

/** La lista entera, no una muestra. Un club que se plantea pagar 29,90 €
 * al mes está comparando con "me lo hago yo con un PDF y una hoja de
 * cálculo", y esa comparación solo se gana enseñando todo lo que hay
 * dentro. */
export async function SeccionPanelYHerramientas() {
  const t = await getTranslations("home");
  const herramientas = t.raw("herramientas.lista") as Herramienta[];
  const metricasPanel = t.raw("panel.metricas") as { numero: string; etiqueta: string }[];

  return (
    <section id="herramientas" className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("panel.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("panel.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("panel.texto")}</p>
        </div>

        {/* Maqueta del panel del club. */}
        <div className="mx-auto mt-12 max-w-4xl rounded-3xl bg-brand-navy-dark p-6 shadow-2xl shadow-brand-navy-dark/30 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-extrabold text-white sm:text-xl">{t("panel.saludo")}</p>
            <span className="rounded-full bg-brand-teal-dark px-5 py-2.5 text-sm font-bold text-white">
              {t("panel.boton")}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metricasPanel.map((metrica) => (
              <div key={metrica.etiqueta} className="rounded-2xl bg-white/[0.07] p-4">
                <div className="text-2xl font-extrabold text-white">{metrica.numero}</div>
                <div className="mt-0.5 text-xs text-white/60">{metrica.etiqueta}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-white/40">{t("panel.nota")}</p>
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("herramientas.eyebrow")}
          </p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            {t("herramientas.titulo")}
          </h3>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("herramientas.texto")}</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {herramientas.map((herramienta) => (
            <div key={herramienta.clave} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
                <IconoHerramienta clave={herramienta.clave} />
              </span>
              <h4 className="mt-4 font-extrabold text-brand-navy">{herramienta.titulo}</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{herramienta.texto}</p>
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
        <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
          {t("sector.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
          {t("sector.titulo")}
          <br className="hidden sm:block" />{" "}
          <span className="text-brand-teal-dark">{t("sector.tituloResalte")}</span>
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-600">{t("sector.subtitulo")}</p>

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
                <p className="whitespace-nowrap text-[1.65rem] font-extrabold leading-none tracking-tight text-brand-teal-dark tabular-nums">
                  {pais.cifra}
                </p>
                <span className="ml-auto shrink-0 rounded-lg bg-brand-teal-light px-2 py-1 text-center">
                  <span className="block whitespace-nowrap text-[13px] font-extrabold leading-tight text-brand-teal-dark tabular-nums">
                    {pais.insignia}
                  </span>
                  <span className="block whitespace-nowrap text-[11px] leading-tight text-brand-teal-dark/80">
                    {pais.insigniaPie}
                  </span>
                </span>
              </div>

              <p className="mt-3 font-bold text-brand-navy">{pais.nombre}</p>
              <p className="text-sm text-zinc-500">{pais.anio}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{pais.texto}</p>
            </div>
          ))}
        </div>

        {/* Fila 2: la comparativa, el reparto europeo y las licencias. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Comparativa por país */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="font-bold text-brand-navy">{comparativa.titulo}</h3>
            <p className="text-sm text-zinc-500">{comparativa.subtitulo}</p>

            <ul className="mt-5 space-y-3">
              {comparativa.barras.map((barra) => (
                <li key={barra.clave} className="flex items-center gap-3">
                  <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-300">
                    <Bandera pais={barra.clave} />
                  </span>
                  <span className="w-24 shrink-0 text-sm font-medium text-brand-navy">
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
                    className={`w-20 shrink-0 text-right text-sm tabular-nums ${
                      barra.destacada
                        ? "font-extrabold text-brand-teal-dark"
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
            <h3 className="font-bold text-brand-navy">{europa.titulo}</h3>
            <p className="text-sm text-zinc-500">{europa.subtitulo}</p>

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
                  <span className="text-xl font-extrabold leading-none text-brand-navy tabular-nums">
                    {europa.porcentaje} %
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-zinc-500">
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
                      <span className="font-medium text-brand-navy">{fila.etiqueta}</span>
                    </span>
                    <span className="ml-4.5 block text-zinc-600 tabular-nums">
                      {fila.cifra} ({fila.porcentaje})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600">{europa.texto}</p>
          </div>

          {/* Licencias federativas */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
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
            <h3 className="mt-4 font-bold text-brand-navy">{licencias.titulo}</h3>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-brand-teal-dark tabular-nums">
              {licencias.cifra}
            </p>
            <p className="text-sm text-zinc-500">{licencias.anio}</p>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{licencias.texto}</p>
          </div>
        </div>

        {/* Las fuentes, al pie y completas: es lo que sostiene la sección. */}
        <dl className="mt-6 grid gap-x-8 gap-y-2 border-t border-zinc-200 pt-5 text-xs leading-relaxed text-zinc-500 sm:grid-cols-2">
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
      <p className="text-right text-[1.6rem] leading-tight text-brand-navy [font-family:var(--font-mano),'Segoe_Script','Bradley_Hand',cursive] xl:text-3xl">
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
        className="ml-auto mt-2 h-16 w-28 text-brand-navy"
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
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-teal-light text-brand-teal-dark">
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
            <p className="font-extrabold leading-snug text-brand-navy">{bloque.titulo}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{bloque.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function SeccionPrecio({ compacta = false }: { compacta?: boolean }) {
  const t = await getTranslations("home");
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
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("precio.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("precio.titulo")}
          </h2>
          <p className="mt-4 text-zinc-600">{t("precio.subtitulo")}</p>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {PLANES_EN_ORDEN.map((plan) => (
            <div
              key={plan.id}
              className={`flex h-full flex-col rounded-3xl bg-white p-8 ${
                plan.destacado
                  ? "border-2 border-brand-teal shadow-xl shadow-brand-teal/15"
                  : "border border-zinc-200 shadow-sm"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
                  {plan.nombre}
                </p>
                {plan.limitado && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {t("precio.plazasFundador")}
                  </span>
                )}
              </div>

              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-brand-navy">
                  {precioFormateado(plan)}
                </span>{" "}
                <span className="text-base text-zinc-500">{periodicidad(plan)}</span>
              </p>

              <p className="mt-2 text-sm font-medium text-zinc-800">{plan.reclamo}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{plan.detalle}</p>

              <Link
                href="/registro-club"
                className={`mt-auto inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-bold transition-colors ${
                  plan.destacado
                    ? "bg-brand-teal-dark text-white shadow-lg shadow-brand-teal/30 hover:bg-brand-navy"
                    : "border border-zinc-300 text-brand-navy hover:bg-zinc-50"
                }`}
              >
                {t("precio.cta")}
              </Link>
            </div>
          ))}
        </div>

        {/* Tres líneas de letra pequeña, una debajo de otra, no se leen:
            se saltan. En la portada van resumidas en una. */}
        {/* `lg:hidden`: a partir de ahí lo dice la tercera tarjeta de la
            franja de abajo, y repetir las mismas condiciones dos veces
            en el mismo pantallazo las hace menos creíbles, no más. */}
        <div className="lg:hidden">
          {compacta ? (
            <p className="mt-7 text-center text-sm text-zinc-600">
              {t("precio.resumenCondiciones")}
            </p>
          ) : (
            <>
              <p className="mt-7 text-center text-sm text-zinc-600">
                {t("precio.gratisPrimerMes")}
              </p>
              <p className="mt-1 text-center text-sm text-zinc-500">{t("precio.cancelar")}</p>
              <p className="mt-1 text-center text-sm text-zinc-500">{t("precio.comision")}</p>
            </>
          )}
        </div>

        <FranjaDelPrecio bloques={franja} />

        {!compacta && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-brand-navy">
              {t("precio.todoIncluye")}
            </p>
            <div className="mt-7 grid gap-3.5 text-left sm:grid-cols-2">
              {ventajas.map((ventaja) => (
                <div key={ventaja} className="flex items-center gap-2.5">
                  <Tic className="flex-none text-brand-teal" tamano={17} />
                  <span className="text-sm font-medium text-zinc-700">{ventaja}</span>
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
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
        {t("faq.titulo")}
      </h2>

      <div className="mt-12 space-y-3">
        {preguntas.map((item) => (
          <details
            key={item.pregunta}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 open:border-brand-teal/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy marker:content-none">
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
            className="text-sm font-bold text-brand-teal-dark underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
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
        <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          {t("ctaFinal.tituloLinea1")}
          <br />
          {t("ctaFinal.tituloLinea2")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70">
          {t("ctaFinal.subtexto")}
        </p>
        <Link
          href="/registro-club"
          className="mt-9 inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/40 transition-colors hover:bg-brand-teal"
        >
          {t("ctaFinal.cta")}
        </Link>
        <p className="mt-4 text-sm text-white/60">{t("ctaFinal.condiciones")}</p>
      </div>
    </section>
  );
}

export async function SeccionContacto() {
  const t = await getTranslations("home");

  return (
    <section id="contacto" className="mx-auto max-w-xl px-4 py-20 sm:px-6 sm:py-28">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
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
        <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
          {t("video.eyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
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

  return (
    <section id="herramientas" className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
            {t("herramientas.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("herramientas.titulo")}
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-600">{t("herramientas.texto")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destacadas.map((herramienta) => (
            <div
              key={herramienta.clave}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
                <IconoHerramienta clave={herramienta.clave} />
              </span>
              <div>
                <h3 className="font-extrabold leading-snug text-brand-navy">
                  {herramienta.titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{herramienta.corto}</p>
              </div>
            </div>
          ))}
        </div>

        {/* El "y hay más". El número sale de la resta, no escrito a mano:
            el día que se añada una herramienta, la portada lo dice sola. */}
        {cuantasMas > 0 && (
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <p className="text-[15px] leading-relaxed text-zinc-600">
              {t("herramientas.hayMas", { cuantas: cuantasMas })}
            </p>
            <Link
              href="/para-clubes#herramientas"
              className="mt-4 inline-block text-sm font-bold text-brand-teal-dark underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
            >
              {t("herramientas.verTodas", { total: todas.length })}
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
export async function FuncionesDestacadas() {
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
    <ul className="mx-auto mt-9 grid max-w-4xl gap-x-6 gap-y-5 text-left sm:grid-cols-2 lg:grid-cols-4">
      {funciones.map((funcion) => (
        <li key={funcion.clave} className="flex items-start gap-3">
          {/* El icono en su cuadrado de color, que es lo que hace que
              la fila se escanee sin leerla: primero se ven cuatro
              marcas, y solo después el texto de la que interesa. */}
          <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
            <IconoHerramienta clave={funcion.clave} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-bold leading-snug text-brand-navy">
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
export async function PuertasDelHero() {
  const t = await getTranslations("home");

  const puertas = [
    {
      href: "/para-clubes",
      cta: t("puertas.clubCta"),
      pie: t("puertas.clubPie"),
      clases:
        "bg-brand-teal-dark text-white hover:bg-brand-teal focus-visible:outline-brand-teal-dark",
    },
    {
      href: "/para-empresas",
      cta: t("puertas.empresaCta"),
      pie: t("puertas.empresaPie"),
      clases:
        "border-2 border-brand-navy bg-white text-brand-navy hover:bg-brand-navy hover:text-white",
    },
  ] as const;

  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
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
          <p className="mt-2.5 text-center text-[13px] leading-snug text-zinc-500">{puerta.pie}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PIEZAS SUELTAS
   ============================================================ */

function DatoMaqueta({ numero, etiqueta }: { numero: string; etiqueta: string }) {
  return (
    <div>
      <div className="text-base font-extrabold text-brand-navy">{numero}</div>
      <div className="text-[11px] text-zinc-500">{etiqueta}</div>
    </div>
  );
}

/** Una casilla del buscador de empresas: la pregunta y la respuesta. */
function CasillaFiltro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 px-5 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{etiqueta}</div>
      <div className="mt-0.5 text-base font-bold text-brand-navy">{valor}</div>
    </div>
  );
}

/** Hoja del dossier: líneas grises, sin texto inventado. */
function HojaDeDossier({ segunda = false }: { segunda?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`w-36 flex-none rounded-xl border border-zinc-200 bg-white p-4 shadow-xl shadow-brand-navy/10 sm:w-44 ${
        segunda ? "mt-8 rotate-2" : "-rotate-2"
      }`}
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
