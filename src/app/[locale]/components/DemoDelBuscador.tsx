"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { CLASES_NIVEL_PATROCINIO } from "@/lib/opportunities";
import { etiquetador } from "@/lib/etiquetas-traducidas";

/**
 * La maqueta animada del buscador en /para-empresas.
 *
 * Cuenta en cinco segundos lo que hace la empresa: rellena las cuatro
 * preguntas una detrás de otra, pulsa "Buscar", sale el "buscando" y
 * aparecen tres oportunidades. Las tarjetas copian la del buscador de
 * verdad (`TarjetaOportunidad` en /buscar): logo, club, lugar, foto,
 * título con su nivel, equipo, texto, etiquetas, objetivos, plazas y
 * precio. Así lo que se enseña aquí es lo que la empresa se encuentra
 * después, no un dibujo más bonito que la realidad.
 *
 * Las tres muestran los tres casos que hay: un patrocinio con precio, uno
 * por plazas (precio por empresa y barra) y una necesidad del club que
 * se paga con visibilidad.
 *
 * Sin JavaScript, o con "reducir movimiento", se ve todo desde el
 * principio y no se mueve nada. Se repite cada vez que se baja hasta
 * ella, como las demás secciones (`EntradaAlBajar`), que por eso no
 * tocan nada de lo que hay aquí dentro (`data-animacion-propia`).
 */

type Fase = "vacio" | 0 | 1 | 2 | 3 | "buscando" | "final";

/** Lo que no se traduce de cada ejemplo: va con las etiquetas de verdad. */
const EJEMPLOS = [
  {
    foto: "/ejemplos-buscador/futbol.webp",
    nivel: "oficial",
    tipo: "youth",
    periodo: "season",
    forma: "money",
    objetivos: ["familias", "deporte_base"],
    plazas: null,
    necesidad: null,
  },
  {
    foto: "/ejemplos-buscador/pabellon.webp",
    nivel: "colaborador",
    tipo: "venue_matches",
    periodo: "match",
    forma: "money",
    objetivos: ["familias", "deporte_femenino"],
    plazas: { total: 12, cubiertas: 7 },
    necesidad: null,
  },
  {
    foto: "/ejemplos-buscador/padel.webp",
    nivel: "colaborador",
    tipo: "in_kind",
    periodo: "event",
    forma: "service",
    objetivos: ["familias", "comunidad_local"],
    plazas: null,
    necesidad: "fisioterapia",
  },
] as const;

const ORDEN_DE_LAS_CASILLAS = [
  { etiqueta: "presupuestoEtiqueta", valor: "presupuestoValor", icono: "monedas" },
  { etiqueta: "ubicacionEtiqueta", valor: "ubicacionValor", icono: "lugar" },
  { etiqueta: "deporteEtiqueta", valor: "deporteValor", icono: "balon" },
  { etiqueta: "publicoEtiqueta", valor: "publicoValor", icono: "personas" },
] as const;

/** Cuándo pasa cada cosa, en milisegundos desde que asoma la sección. */
const TIEMPOS: [Fase, number][] = [
  [0, 350],
  [1, 850],
  [2, 1350],
  [3, 1850],
  ["buscando", 2500],
  ["final", 3500],
];

type Resultado = {
  club: string;
  lugar: string;
  distancia: string;
  titulo: string;
  equipo: string;
  texto: string;
  precio: string;
};

export function DemoDelBuscador() {
  const t = useTranslations("home.empresas");
  const tBuscar = useTranslations("buscar.resultados");
  const tPrecio = useTranslations("common.precio");
  const E = etiquetador(useTranslations("common.etiquetas"));
  const resultados = t.raw("resultados") as Resultado[];

  // "final" de partida: es lo que pinta el servidor y lo que ve quien no
  // tiene JavaScript. La animación lo vacía en cuanto llega al navegador.
  const [fase, setFase] = useState<Fase>("final");
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = caja.current;
    if (!elemento) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    let relojes: number[] = [];
    const parar = () => {
      relojes.forEach((reloj) => window.clearTimeout(reloj));
      relojes = [];
    };
    const empezar = () => {
      parar();
      setFase("vacio");
      relojes = TIEMPOS.map(([siguiente, ms]) => window.setTimeout(() => setFase(siguiente), ms));
    };

    // Si al cargar ya está a la vista, se anima igual: es justo lo que
    // está mirando.
    let enMarcha = false;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          if (!enMarcha) {
            enMarcha = true;
            empezar();
          }
        } else if (entrada.boundingClientRect.top > 0) {
          // Ha vuelto a quedar por debajo: lista para la próxima bajada.
          parar();
          enMarcha = false;
          setFase("vacio");
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observador.observe(elemento);
    return () => {
      parar();
      observador.disconnect();
    };
  }, []);

  const rellenas = fase === "vacio" ? -1 : typeof fase === "number" ? fase : 3;
  const buscando = fase === "buscando";
  const hayResultados = fase === "final";

  return (
    <div ref={caja} data-animacion-propia="" className="mx-auto mt-6 max-w-5xl">
      <Link
        href="/buscar"
        className="group relative block rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-brand-navy/10 backdrop-blur transition-colors hover:border-brand-teal sm:p-6"
      >
        <span className="absolute -top-3 right-5 rounded-full bg-brand-navy px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sobre-color">
          {t("muestra")}
        </span>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {ORDEN_DE_LAS_CASILLAS.map((casilla, indice) => {
            const llena = indice <= rellenas;
            const activa = indice === rellenas && typeof fase === "number";
            return (
              <div
                key={casilla.valor}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300 sm:px-4 ${
                  activa
                    ? "border-brand-teal bg-teal-50/60 ring-4 ring-brand-teal/15"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span
                  className={`hidden h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors duration-300 sm:flex ${
                    llena ? "bg-brand-teal-light text-brand-teal-dark" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Icono nombre={casilla.icono} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase leading-tight tracking-wide text-zinc-500 sm:text-[11px]">
                    {t(`filtros.${casilla.etiqueta}`)}
                  </span>
                  <span className="mt-0.5 block h-6 text-[15px] font-bold text-titular sm:text-base">
                    {llena ? (
                      <span key={`${casilla.valor}-${fase === "final" ? "f" : "a"}`} className={activa ? "demo-aparece inline-block" : ""}>
                        {t(`filtros.${casilla.valor}`)}
                        {activa && <span className="demo-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-brand-teal" />}
                      </span>
                    ) : (
                      <span className="inline-block h-3 w-16 rounded-full bg-zinc-100" />
                    )}
                  </span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            );
          })}
        </div>

        <span
          className={`relative mx-auto mt-4 flex w-full max-w-md items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-base font-bold text-sobre-color shadow-lg shadow-brand-teal/30 transition-all duration-200 sm:mt-5 ${
            buscando ? "scale-[0.97] bg-brand-navy" : "bg-brand-teal-dark group-hover:bg-brand-navy"
          }`}
        >
          {buscando ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <circle cx="11" cy="11" r="7.5" />
              <path d="m20.5 20.5-4.2-4.2" />
            </svg>
          )}
          {buscando ? t("buscando") : t("filtros.buscar")}
          {hayResultados && <span className="demo-brillo" aria-hidden />}
        </span>
      </Link>

      <div className="mt-7 flex h-6 items-center justify-between gap-3 px-1">
        <p className={`text-sm font-semibold text-titular transition-opacity duration-500 ${hayResultados ? "opacity-100" : "opacity-0"}`}>
          {t("encontradas")}
        </p>
        <Link
          href="/buscar"
          className={`text-sm font-semibold text-accion-tinta transition-opacity duration-500 hover:underline ${
            hayResultados ? "opacity-100" : "opacity-0"
          }`}
        >
          {t("verReales")} →
        </Link>
      </div>

      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EJEMPLOS.map((ejemplo, indice) => {
          const r = resultados[indice];
          if (!r) return null;
          return (
            <li key={r.titulo} className="relative">
              {/* La tarjeta está siempre en su sitio para que nada salte
                  al aparecer: antes de los resultados es invisible y
                  encima va su hueco (o el esqueleto mientras busca). */}
              {!hayResultados && (
                <div
                  aria-hidden
                  className={`absolute inset-0 z-10 rounded-xl border p-4 ${
                    buscando ? "border-zinc-200 bg-white" : "border-dashed border-zinc-300/80 bg-white/40"
                  }`}
                >
                  {buscando && <Esqueleto />}
                </div>
              )}
              <div
                className={hayResultados ? "demo-tarjeta h-full" : "invisible h-full"}
                style={{ "--retraso": `${indice * 140}ms` } as React.CSSProperties}
              >
                <Tarjeta
                  r={r}
                  ejemplo={ejemplo}
                  etiquetas={[E.tipoOportunidad(ejemplo.tipo), E.periodo(ejemplo.periodo), E.formaColaboracion(ejemplo.forma)]}
                  objetivos={ejemplo.objetivos.map((objetivo) => E.objetivo(objetivo))}
                  nivel={E.nivelPatrocinio(ejemplo.nivel)}
                  necesidad={
                    ejemplo.necesidad ? `${t("loNecesitan")} · ${E.categoriaNecesidad(ejemplo.necesidad)}` : null
                  }
                  plazas={
                    ejemplo.plazas
                      ? tBuscar("plazas", { libres: ejemplo.plazas.total - ejemplo.plazas.cubiertas, total: ejemplo.plazas.total })
                      : null
                  }
                  precio={r.precio ? r.precio : tPrecio("necesidad")}
                  porEmpresa={ejemplo.plazas ? tBuscar("porEmpresa") : null}
                  verFicha={tBuscar("verFicha")}
                  verClub={tBuscar("verClub")}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Copia de la tarjeta del buscador (`TarjetaOportunidad`), con datos de muestra. */
function Tarjeta({
  r,
  ejemplo,
  etiquetas,
  objetivos,
  nivel,
  necesidad,
  plazas,
  precio,
  porEmpresa,
  verFicha,
  verClub,
}: {
  r: Resultado;
  ejemplo: (typeof EJEMPLOS)[number];
  etiquetas: string[];
  objetivos: string[];
  nivel: string;
  necesidad: string | null;
  plazas: string | null;
  precio: string;
  porEmpresa: string | null;
  verFicha: string;
  verClub: string;
}) {
  const conPrecio = !!r.precio;
  return (
    <Link
      href="/buscar"
      className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-teal/60 hover:shadow-xl hover:shadow-brand-navy/10"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">
          {inicialDelClub(r.club)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-700">{r.club}</p>
          <p className="text-[13px] text-zinc-600">
            {r.lugar}
            <span className="font-medium text-teal-700"> · {r.distancia}</span>
          </p>
        </div>
        <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <Image
          src={ejemplo.foto}
          alt=""
          width={640}
          height={320}
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
          className="aspect-[2/1] w-full object-cover transition duration-700 hover:scale-105"
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900">{r.titulo}</p>
          {necesidad && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{necesidad}</span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASES_NIVEL_PATROCINIO[ejemplo.nivel]}`}>{nivel}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-zinc-600">{r.equipo}</p>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{r.texto}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {etiquetas.map((etiqueta) => (
          <span key={etiqueta} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {etiqueta}
          </span>
        ))}
        {objetivos.map((objetivo) => (
          <span key={objetivo} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            {objetivo}
          </span>
        ))}
      </div>

      {plazas && ejemplo.plazas && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-accion-tinta">{plazas}</p>
          <BarraDePlazas slotsTotal={ejemplo.plazas.total} slotsTaken={ejemplo.plazas.cubiertas} />
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <p className={`font-bold ${conPrecio ? "text-lg text-teal-700" : "text-sm text-zinc-700"}`}>
          {precio}
          {porEmpresa && <span className="ml-1 text-[13px] font-medium text-zinc-600">{porEmpresa}</span>}
        </p>
        <span className="flex flex-none items-center gap-2">
          <span className="rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-medium text-teal-800">{verFicha}</span>
          <span className="rounded-lg bg-accion px-3 py-1.5 text-xs font-medium text-sobre-color">{verClub}</span>
        </span>
      </div>
    </Link>
  );
}

/** La letra del "logo" cuando el club no tiene: la de su nombre de
 * verdad, no la de "Club" ni la de "Las" (EF Las Palmeras → P). */
const PALABRAS_DE_RELLENO = new Set(["ef", "cbm", "cb", "cd", "cf", "club", "pádel", "padel", "handebol", "las", "los", "la", "el", "do", "de"]);
function inicialDelClub(nombre: string): string {
  const palabra = nombre.split(/\s+/).find((p) => !PALABRAS_DE_RELLENO.has(p.toLowerCase())) ?? nombre;
  return palabra.charAt(0).toUpperCase();
}

/** El hueco de una tarjeta mientras "busca": la misma forma, en gris. */
function Esqueleto() {
  return (
    <div className="demo-esqueleto flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-100" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
          <div className="h-2.5 w-1/3 rounded-full bg-zinc-100" />
        </div>
      </div>
      <div className="aspect-[2/1] w-full rounded-lg bg-zinc-100" />
      <div className="h-3.5 w-3/4 rounded-full bg-zinc-100" />
      <div className="h-2.5 w-full rounded-full bg-zinc-100" />
      <div className="h-2.5 w-5/6 rounded-full bg-zinc-100" />
      <div className="mt-auto flex justify-between">
        <div className="h-5 w-16 rounded-full bg-zinc-100" />
        <div className="h-7 w-32 rounded-lg bg-zinc-100" />
      </div>
    </div>
  );
}

function Icono({ nombre }: { nombre: (typeof ORDEN_DE_LAS_CASILLAS)[number]["icono"] }) {
  const trazos: Record<typeof nombre, ReactNode> = {
    monedas: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
      </>
    ),
    lugar: (
      <>
        <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    balon: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="m12 7.5 4.3 3.1-1.6 5h-5.4l-1.6-5zM12 7.5V2.5M16.3 10.6l4.7-1.6M14.7 15.6l2.9 4M9.3 15.6l-2.9 4M7.7 10.6 3 9" />
      </>
    ),
    personas: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {trazos[nombre]}
    </svg>
  );
}
