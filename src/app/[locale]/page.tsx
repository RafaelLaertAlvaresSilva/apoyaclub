import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { PLANES_EN_ORDEN, periodicidad, precioFormateado } from "@/lib/planes";
import { FormularioContacto } from "./components/FormularioContacto";
import { MenuDeSecciones } from "./components/MenuDeSecciones";

/**
 * Landing de conversión (Fase 13, rediseño Fase 15). Evolución visual
 * de la landing anterior: mismo contenido y conceptos (dos caminos,
 * problema/solución, precio, cómo funciona, FAQ, fiscalidad, contacto),
 * con más aire, jerarquía y una estética más "SaaS premium" acorde al
 * sistema de diseño de Fase 1 (tokens `brand-navy`/`brand-teal`). El
 * Footer con los enlaces legales lo sigue poniendo `app/layout.tsx`.
 *
 * Las fotografías reales de clubes quedan pendientes de contenido: las
 * maquetas (página de club, dossier, panel) usan datos de ejemplo,
 * marcados como tales, en vez de datos inventados que parezcan reales.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

/** Colores del filo superior de cada tarjeta de ejemplo. Van por
 * posición, junto a los textos de `home.oportunidades.ejemplos`. */
const ACENTOS_OPORTUNIDAD = [
  "bg-brand-navy",
  "bg-brand-teal-dark",
  "bg-brand-teal",
  "bg-brand-navy-dark",
  "bg-brand-navy",
  "bg-brand-teal-dark",
  "bg-brand-teal",
  "bg-brand-navy-dark",
  "bg-brand-navy",
  "bg-brand-teal-dark",
  "bg-brand-teal",
  "bg-brand-navy-dark",
  "bg-brand-navy",
  "bg-brand-teal-dark",
] as const;

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

type TextoConTitulo = { titulo: string; texto: string };

export default async function Home() {
  const t = await getTranslations("home");

  // Los textos que son listas viven en `messages/es/home.json` como
  // arrays; `t.raw` los devuelve tal cual (next-intl solo interpola
  // cadenas sueltas).
  const tags = t.raw("problema.tags") as string[];
  const pasos = t.raw("comoFunciona.pasos") as TextoConTitulo[];
  const ejemplosOportunidad = t.raw("oportunidades.ejemplos") as TextoConTitulo[];
  const resultadosEjemplo = t.raw("empresas.resultados") as {
    categoria: string;
    titulo: string;
    texto: string;
    precio: string;
  }[];
  const herramientas = t.raw("herramientas.lista") as TextoConTitulo[];
  const metricasPanel = t.raw("panel.metricas") as { numero: string; etiqueta: string }[];
  const ventajas = t.raw("precio.ventajas") as string[];
  const puntosSeguimiento = t.raw("seguimiento.puntos") as TextoConTitulo[];
  const preguntas = t.raw("faq.preguntas") as { pregunta: string; respuesta: string }[];

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-navy/5 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-brand-teal-dark">
              {t("hero.etiqueta")}
            </span>

            {/* Un escalón menos que antes. El titular de ahora es bastante
                más largo que el que había, y al tamaño anterior ocupaba
                media pantalla él solo: un titular que hay que leer en
                tres saltos deja de ser un titular. */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
              {t("hero.tituloParte1")}{" "}
              <span className="text-brand-teal-dark">{t("hero.tituloParte2")}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              {t("hero.subtitulo")}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3">
              <Link
                href="/registro-club"
                className="inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
              >
                {t("hero.cta")}
              </Link>
              <p className="text-sm text-zinc-500">{t("hero.condiciones")}</p>
            </div>

            {/* CLUB -> OPORTUNIDAD -> EMPRESA */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-2 pl-2.5 pr-5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-brand-navy">{t("hero.cadenaClub")}</span>
              </div>
              <svg aria-hidden="true" width="22" height="14" viewBox="0 0 24 14" fill="none" className="text-zinc-300">
                <path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-2 pl-2.5 pr-5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-brand-navy">{t("hero.cadenaOportunidad")}</span>
              </div>
              <svg aria-hidden="true" width="22" height="14" viewBox="0 0 24 14" fill="none" className="text-zinc-300">
                <path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-2 pl-2.5 pr-5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy-dark">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="12" rx="1.5" />
                    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-brand-navy">{t("hero.cadenaEmpresa")}</span>
              </div>
            </div>
          </div>
        </section>

        <MenuDeSecciones />

        {/* ============ SOY CLUB / SOY EMPRESA ============ */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 sm:py-20">
          <div className="rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-dark p-10 text-white shadow-xl shadow-brand-navy/20">
            <h3 className="text-2xl font-extrabold">{t("caminos.clubTitulo")}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/80">
              {t("caminos.clubTexto")}
            </p>
            <Link
              href="/registro-club"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-teal-dark px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
            >
              {t("caminos.clubCta")}
            </Link>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <h3 className="text-2xl font-extrabold text-brand-navy">{t("caminos.empresaTitulo")}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-600">
              {t("caminos.empresaTexto")}
            </p>
            <Link
              href="/buscar"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-navy-dark"
            >
              {t("caminos.empresaCta")}
            </Link>
          </div>
        </section>

        {/* ============ PROBLEMA / VALOR ============ */}
        <section id="clubes" className="scroll-mt-32 bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">{t("problema.eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              {t("problema.titulo")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-600">
              {t("problema.texto")}
            </p>
          </div>
          <div className="mx-auto mt-11 flex max-w-3xl flex-wrap justify-center gap-3">
            {tags.map((tag) => (
              <Badge key={tag} tone="navy" className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-brand-navy">
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {/* ============ CÓMO FUNCIONA ============ */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">{t("comoFunciona.titulo")}</h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {pasos.map((paso, indice) => (
              <div key={paso.titulo} className="text-center">
                <div className="text-sm font-extrabold tracking-wide text-zinc-500">0{indice + 1}</div>
                <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal-light">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {indice === 0 ? (
                      <>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                      </>
                    ) : indice === 1 ? (
                      <>
                        <path d="M12 3v12" />
                        <path d="M6 9l6-6 6 6" />
                        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                      </>
                    ) : (
                      <>
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </>
                    )}
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-bold text-brand-navy">{paso.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{paso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ OPORTUNIDADES ============ */}
        <section className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">{t("oportunidades.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
                {t("oportunidades.titulo")}
              </h2>
              <p className="mx-auto mt-4 text-zinc-600">{t("oportunidades.texto")}</p>
            </div>
            <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ejemplosOportunidad.map((oportunidad, indice) => (
                <div key={oportunidad.titulo} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className={`h-1.5 ${ACENTOS_OPORTUNIDAD[indice % ACENTOS_OPORTUNIDAD.length]}`} />
                  <div className="p-5">
                    <h4 className="text-[15px] font-bold text-brand-navy">{oportunidad.titulo}</h4>
                    <p className="mt-1.5 text-sm text-zinc-500">{oportunidad.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PARA EMPRESAS: BUSCADOR ============ */}
        <section id="empresas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">{t("empresas.eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              {t("empresas.titulo")}
            </h2>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-brand-navy/5 sm:p-6">
            <div className="grid gap-2.5 sm:grid-cols-[repeat(4,1fr)_auto]">
              <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.presupuesto")}</div>
                <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.presupuestoValor")}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.ubicacion")}</div>
                <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.ubicacionValor")}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.publico")}</div>
                <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.publicoValor")}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.deporte")}</div>
                <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.deporteValor")}</div>
              </div>
              <Link
                href="/buscar"
                className="flex items-center justify-center rounded-xl bg-brand-teal-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
              >
                {t("empresas.filtros.buscar")}
              </Link>
            </div>

            <details className="group mt-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand-teal-dark marker:content-none">
                {t("empresas.filtros.masFiltros")}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition-transform group-open:rotate-180">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="mt-3 grid gap-2.5 border-t border-zinc-100 pt-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.tipo")}</div>
                  <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.tipoValor")}</div>
                </div>
                <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.categoria")}</div>
                  <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.categoriaValor")}</div>
                </div>
                <div className="rounded-xl border border-zinc-200 px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-zinc-500">{t("empresas.filtros.alcance")}</div>
                  <div className="text-sm font-semibold text-brand-navy">{t("empresas.filtros.alcanceValor")}</div>
                </div>
              </div>
            </details>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            {resultadosEjemplo.map((resultado) => (
              <div key={resultado.titulo} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <Badge tone="teal" className="mb-3">
                  {resultado.categoria.toUpperCase()}
                </Badge>
                <h4 className="text-[15px] font-bold text-brand-navy">{resultado.titulo}</h4>
                <p className="mt-1.5 text-sm text-zinc-500">{resultado.texto}</p>
                <div className="mt-3 text-lg font-extrabold text-brand-navy">{resultado.precio}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-zinc-500">{t("empresas.avisoEjemplos")}</p>
        </section>

        {/* ============ PÁGINA PROFESIONAL DEL CLUB ============ */}
        <section id="tu-pagina" className="mx-auto grid max-w-6xl scroll-mt-32 items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">{t("paginaClub.eyebrow")}</p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-brand-navy sm:text-3xl">
              {t("paginaClub.titulo")}
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-600">
              {t("paginaClub.texto")}
            </p>
            <p className="mt-4 leading-relaxed text-zinc-600">
              {t("paginaClub.texto2")}
            </p>
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
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
                </svg>
              </div>
            </div>
            <div className="px-6 pb-6 pt-3.5">
              <div className="text-[17px] font-extrabold text-brand-navy">{t("paginaClub.maqueta.nombre")}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="teal">{t("paginaClub.maqueta.etiqueta1")}</Badge>
                <Badge tone="teal">{t("paginaClub.maqueta.etiqueta2")}</Badge>
                <Badge tone="neutral">{t("paginaClub.maqueta.etiqueta3")}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2.5 border-t border-zinc-100 pt-4">
                <div>
                  <div className="text-base font-extrabold text-brand-navy">12,4k</div>
                  <div className="text-[11px] text-zinc-500">{t("paginaClub.maqueta.seguidores")}</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-brand-navy">48k</div>
                  <div className="text-[11px] text-zinc-500">{t("paginaClub.maqueta.alcance")}</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-brand-navy">9</div>
                  <div className="text-[11px] text-zinc-500">{t("paginaClub.maqueta.equipos")}</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-brand-navy">3</div>
                  <div className="text-[11px] text-zinc-500">{t("paginaClub.maqueta.oportunidades")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SEGUIMIENTO DEL PATROCINIO ============ */}
        {/* Es la parte que distingue a ApoyaClub de un directorio y no
            se contaba en ninguna parte de la portada. */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
              {t("seguimiento.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              {t("seguimiento.titulo")}
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-600">{t("seguimiento.texto")}</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {puntosSeguimiento.map((punto, indice) => (
              <div key={punto.titulo} className="rounded-2xl border border-zinc-200 bg-white p-7">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-light text-sm font-extrabold text-brand-teal-dark">
                  {indice + 1}
                </span>
                <h3 className="mt-4 font-extrabold text-brand-navy">{punto.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{punto.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ HERRAMIENTAS ============ */}
        {/* La lista entera, no una muestra. Un club que se plantea pagar
            29,90 € al mes está comparando con "me lo hago yo con un PDF
            y una hoja de cálculo", y esa comparación solo se gana
            enseñando todo lo que hay dentro. Los textos viven en
            `messages/es/home.json`. */}
        <section id="herramientas" className="scroll-mt-32 bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
                {t("herramientas.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
                {t("herramientas.titulo")}
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600">{t("herramientas.texto")}</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {herramientas.map((herramienta, indice) => (
                <div
                  key={herramienta.titulo}
                  className="rounded-2xl border border-zinc-200 bg-white p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark">
                    <svg
                      width="20"
                      height="20"
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
                  <h3 className="mt-4 font-extrabold text-brand-navy">{herramienta.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{herramienta.texto}</p>
                </div>
              ))}
            </div>

            {/* La maqueta del panel se queda: la lista dice qué hay, y
                esto dice dónde está. */}
            <div className="mt-8 rounded-3xl bg-brand-navy-dark p-9 shadow-lg shadow-brand-navy-dark/30">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-extrabold text-white">{t("panel.titulo")}</h3>
                <span className="rounded-full bg-brand-teal-dark px-4 py-2 text-xs font-bold text-white">
                  {t("panel.boton")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {metricasPanel.map((metrica) => (
                  <div key={metrica.etiqueta} className="rounded-xl bg-white/[0.06] p-3.5">
                    <div className="text-xl font-extrabold text-white">{metrica.numero}</div>
                    <div className="text-[11px] text-white/60">{metrica.etiqueta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ============ PRECIO ============ */}
        {/* Los tres planes salen de `lib/planes.ts`, que es de donde los
            leen también la página de suscripción, el área financiera y
            Stripe. Si estuvieran escritos aquí a mano, el día que suba
            el precio la portada seguiría enseñando el viejo. */}
        <section id="precio" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-24 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("precio.titulo")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600">{t("precio.subtitulo")}</p>

          <div className="mt-11 grid items-start gap-6 lg:grid-cols-3">
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
                  className={`mt-auto inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-base font-bold transition-colors ${
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

          <p className="mt-6 text-center text-sm text-zinc-600">{t("precio.gratisPrimerMes")}</p>
          <p className="mt-1 text-center text-sm text-zinc-500">{t("precio.comision")}</p>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-brand-navy">
              {t("precio.todoIncluye")}
            </p>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              {ventajas.map((ventaja) => (
                <div key={ventaja} className="flex items-center gap-2.5">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="flex-none text-brand-teal">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">{ventaja}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-32 px-4 py-24 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("faq.titulo")}
          </h2>

          <div className="mt-11 space-y-3">
            {preguntas.map((item) => (
              <details
                key={item.pregunta}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 open:border-brand-teal/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy marker:content-none">
                  {item.pregunta}
                  <span className="flex-none text-zinc-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.respuesta}</p>
              </details>
            ))}
          </div>

          {/* Fiscalidad: aviso de que no se ofrece asesoramiento fiscal */}
          <div role="alert" className="mt-8 flex gap-3.5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* ============ CTA FINAL ============ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navy-dark px-4 py-24 text-center sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-teal/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {t("ctaFinal.tituloLinea1")}
              <br />
              {t("ctaFinal.tituloLinea2")}
            </h2>
            <Link
              href="/registro-club"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/40 transition-colors hover:bg-brand-navy"
            >
              {t("ctaFinal.cta")}
            </Link>
          </div>
        </section>

        {/* ============ CONTACTO ============ */}
        <section id="contacto" className="mx-auto max-w-xl px-4 py-24 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("contacto.titulo")}
          </h2>
          <p className="mt-3 text-center text-zinc-600">
            {t("contacto.texto")}
          </p>

          <div className="mt-9 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <FormularioContacto />
          </div>
        </section>
      </main>
    </div>
  );
}
