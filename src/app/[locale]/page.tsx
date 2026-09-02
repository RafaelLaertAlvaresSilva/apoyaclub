import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { FormularioContacto } from "./components/FormularioContacto";

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
  const importes = t.raw("presupuesto.importes") as string[];
  const metricasPanel = t.raw("panel.metricas") as { numero: string; etiqueta: string }[];
  const ventajas = t.raw("precio.ventajas") as string[];
  const preguntas = t.raw("faq.preguntas") as { pregunta: string; respuesta: string }[];

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-20 sm:px-6 sm:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-navy/5 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-7 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-brand-teal-dark">
              {t("hero.etiqueta")}
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
              {t("hero.tituloParte1")}{" "}
              <span className="text-brand-teal-dark">{t("hero.tituloParte2")}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
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
        <section id="clubes" className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
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
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">{t("comoFunciona.titulo")}</h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
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

        {/* ============ PRESUPUESTO ============ */}
        <section className="bg-brand-navy px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{t("presupuesto.titulo")}</h2>
            <p className="mt-2.5 text-white/70">{t("presupuesto.texto")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {importes.map((importe, indice) => (
                <span
                  key={importe}
                  className={`rounded-full border px-6 py-3 text-sm font-bold ${
                    indice === 1
                      ? "border-brand-teal bg-brand-teal text-brand-navy-dark"
                      : "border-white/20 bg-white/5 text-white"
                  }`}
                >
                  {importe}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PÁGINA PROFESIONAL DEL CLUB ============ */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
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

        {/* ============ DOSSIER + PANEL ============ */}
        <section className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-9 shadow-sm">
              <h3 className="text-xl font-extrabold text-brand-navy">{t("dossier.titulo")}</h3>
              <p className="mt-2 text-sm text-zinc-600">
                {t("dossier.texto")}
              </p>
              <div className="mt-6 flex items-center gap-5">
                <div className="w-24 flex-none rounded-lg border border-zinc-200 bg-white p-2.5 shadow-md shadow-brand-navy/10">
                  <div className="mb-2 h-1.5 w-3/5 rounded bg-brand-navy" />
                  <div className="mb-1 h-0.5 w-full rounded bg-zinc-200" />
                  <div className="mb-1 h-0.5 w-11/12 rounded bg-zinc-200" />
                  <div className="mb-2.5 h-0.5 w-full rounded bg-zinc-200" />
                  <div className="mb-2 h-6 w-full rounded bg-brand-teal-light" />
                  <div className="mb-1 h-0.5 w-4/5 rounded bg-zinc-200" />
                  <div className="h-0.5 w-5/6 rounded bg-zinc-200" />
                </div>
                <span className="inline-flex items-center rounded-full bg-brand-navy px-5 py-3 text-sm font-bold text-white">
                  {t("dossier.boton")}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-brand-navy-dark p-9 shadow-lg shadow-brand-navy-dark/30">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-white">{t("panel.titulo")}</h3>
                <span className="rounded-full bg-brand-teal-dark px-4 py-2 text-xs font-bold text-white">{t("panel.boton")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
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
        <section id="precio" className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">{t("precio.titulo")}</h2>
          <div className="mt-11 rounded-3xl border-2 border-brand-teal bg-white p-10 shadow-xl shadow-brand-teal/15">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">{t("precio.eyebrow")}</p>
            <p className="mt-3">
              <span className="text-5xl font-extrabold tracking-tight text-brand-navy">{t("precio.importe")}</span>
              <span className="text-lg text-zinc-500">{t("precio.periodo")}</span>
            </p>
            <p className="mt-1.5 text-sm text-zinc-500">{t("precio.condiciones")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("precio.comision")}</p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              {ventajas.map((ventaja) => (
                <div key={ventaja} className="flex items-center gap-2.5">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="flex-none text-brand-teal">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">{ventaja}</span>
                </div>
              ))}
            </div>

            <Link
              href="/registro-club"
              className="mt-9 inline-flex w-full items-center justify-center rounded-2xl bg-brand-teal-dark px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
            >
              {t("precio.cta")}
            </Link>
          </div>
        </section>

        {/* ============ CONFIANZA ============ */}
        <section className="bg-zinc-50 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">{t("confianza.eyebrow")}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[t("confianza.tipoClub"), t("confianza.tipoEmpresa"), t("confianza.tipoClub")].map((tipo, indice) => (
                <div key={indice} className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                  <div className="mb-3 flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--brand-teal)">
                        <path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-zinc-600">{t("confianza.testimonio", { tipo })}</p>
                  <div className="mt-3.5 text-sm font-bold text-brand-navy">
                    {tipo === t("confianza.tipoEmpresa") ? t("confianza.autorEmpresa") : t("confianza.autorClub")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
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
