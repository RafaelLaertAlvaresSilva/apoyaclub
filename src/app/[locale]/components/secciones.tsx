import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
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

/** Un icono por herramienta, por posición, junto a los textos de
 * `home.herramientas.lista`. Trazos sueltos en vez de una librería de
 * iconos: son doce dibujos y no compensa cargar un paquete entero. */
const ICONOS_HERRAMIENTA = [
  // Dossier: un documento con su esquina doblada.
  "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zm0 0v4h4M9 13h6M9 17h4",
  // Oportunidades: un rayo.
  "M13 2 3 14h7l-1 8 10-12h-7z",
  // Tareas: una lista con sus marcas.
  "M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 10M4 18l1.2 1.2L7.5 16",
  // Informe: barras.
  "M3 21h18M6 21V11M12 21V4M18 21v-7",
  // Público: gente.
  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  // Estadísticas: un ojo.
  "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  // Solicitudes: un sobre.
  "M3 6h18v12H3zM3 7l9 6 9-6",
  // Patrocinadores: un escudo.
  "M12 3l8 3v5.5c0 4.7-3.4 8.4-8 9.5-4.6-1.1-8-4.8-8-9.5V6z",
  // ProspectPro: una lupa.
  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  // Acción social: un corazón.
  "M12 21S3 15.5 3 9.8A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 9 2.8C21 15.5 12 21 12 21Z",
  // Servicios: una furgoneta.
  "M3 6h11v11H3zM14 10h4l3 3v4h-7zM7.5 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M16 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0",
  // Tu página: una ventana de navegador.
  "M3 5h18v14H3zM3 9h18M6.5 7h.01M9 7h.01",
] as const;

/** Filo de color de cada tarjeta de oportunidad, por posición. */
const ACENTOS_OPORTUNIDAD = ["bg-brand-navy", "bg-brand-teal-dark", "bg-brand-teal"] as const;

/* ============================================================
   CÓMO FUNCIONA
   ============================================================ */

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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((paso, indice) => (
            <div key={paso.clave} className="rounded-3xl border border-zinc-200 bg-white p-7">
              <span className="text-4xl font-extrabold tabular-nums text-brand-teal/40">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-sm font-extrabold uppercase tracking-wider text-brand-teal-dark">
                {paso.clave}
              </p>
              <h3 className="mt-2 text-lg font-extrabold leading-snug text-brand-navy">
                {paso.titulo}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{paso.texto}</p>
            </div>
          ))}
        </div>
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

      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-2xl bg-zinc-50 px-6 py-5 text-center">
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
  const herramientas = t.raw("herramientas.lista") as TextoConTitulo[];
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
          {herramientas.map((herramienta, indice) => (
            <div key={herramienta.titulo} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
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
                  <path d={ICONOS_HERRAMIENTA[indice % ICONOS_HERRAMIENTA.length]} />
                </svg>
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
export async function SeccionPrecio({ compacta = false }: { compacta?: boolean }) {
  const t = await getTranslations("home");
  const ventajas = t.raw("precio.ventajas") as string[];

  return (
    <section id="precio" className="scroll-mt-32 bg-zinc-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
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

        <p className="mt-7 text-center text-sm text-zinc-600">{t("precio.gratisPrimerMes")}</p>
        <p className="mt-1 text-center text-sm text-zinc-500">{t("precio.cancelar")}</p>
        <p className="mt-1 text-center text-sm text-zinc-500">{t("precio.comision")}</p>

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
   PIEZAS SUELTAS
   ============================================================ */

/** CLUB → OPORTUNIDAD → EMPRESA: el concepto entero en tres palabras. */
export async function CadenaDelConcepto() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
      <EslabonCadena color="bg-brand-navy" texto={t("hero.cadenaClub")}>
        <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
      </EslabonCadena>
      <FlechaCadena />
      <EslabonCadena color="bg-brand-teal" texto={t("hero.cadenaOportunidad")}>
        <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
      </EslabonCadena>
      <FlechaCadena />
      <EslabonCadena color="bg-brand-navy-dark" texto={t("hero.cadenaEmpresa")}>
        <rect x="3" y="8" width="18" height="12" rx="1.5" />
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </EslabonCadena>
    </div>
  );
}

/** Una de las tres palabras de CLUB → OPORTUNIDAD → EMPRESA. */
function EslabonCadena({
  color,
  texto,
  children,
}: {
  color: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-2 pl-2.5 pr-5 shadow-sm">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {children}
        </svg>
      </span>
      <span className="text-sm font-bold text-brand-navy">{texto}</span>
    </div>
  );
}

function FlechaCadena() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="14"
      viewBox="0 0 24 14"
      fill="none"
      className="rotate-90 text-zinc-300 sm:rotate-0"
    >
      <path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

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
