import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * "¿Y si me registro?" en /para-empresas: para qué sirve la cuenta de
 * empresa, que es opcional y gratis.
 *
 * Las cuatro ventajas son las que existen hoy: ficha en el directorio,
 * publicar lo que ofreces, avisos por correo (uno al día como mucho) y
 * favoritos. Cada una lleva un dibujo pequeño hecho aquí, sin fotos, con
 * algo que se mueve (el aviso que llega, los corazones…); los movimientos
 * están en `globals.css` ("¿Y SI ME REGISTRO?").
 *
 * El portátil con el panel y el empresario solo salen en el ordenador:
 * en el móvil empujarían el titular hacia abajo sin decir nada nuevo.
 */
export async function SeccionCuentaEmpresa() {
  const t = await getTranslations("home.paraEmpresas.cuenta");
  const ventajas = t.raw("ventajas") as { titulo: string; texto: string }[];
  const titulo = t("titulo");
  const resalta = t("tituloResalta");
  const tieneResalte = !!resalta && titulo.includes(resalta);
  const corte = tieneResalte ? titulo.indexOf(resalta) : titulo.length;
  const antes = titulo.slice(0, corte);
  const despues = tieneResalte ? titulo.slice(corte + resalta.length) : "";

  const dibujos = [<DibujoFicha key="1" />, <DibujoPublicar key="2" />, <DibujoAviso key="3" />, <DibujoFavoritos key="4" />];

  return (
    <section id="cuenta" className="relative scroll-mt-32 overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-teal-50/60 px-4 py-20 sm:px-6 sm:py-28">
      <svg aria-hidden viewBox="0 0 1440 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-brand-teal/15">
        <path fill="currentColor" d="M0 70c260 70 520 90 760 50s460-80 680-20v60H0z" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,36rem)_1fr]">
          <div aria-hidden className="relative hidden h-64 lg:block">
            <PortatilConPanel />
          </div>

          <div className="text-center">
            <p className="inline-block rounded-full bg-brand-teal-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accion-tinta">
              {t("eyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-5xl">
              {antes}
              {tieneResalte && (
                <span className="relative inline-block">
                  {resalta}
                  <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-brand-teal-dark sm:-bottom-3 sm:h-4">
                    <path d="M3 11C50 4 120 2 197 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              )}
              {despues}
              <svg aria-hidden viewBox="0 0 30 30" className="relative -top-4 ml-1 inline-block h-6 w-6 text-brand-teal-dark sm:-top-6 sm:h-8 sm:w-8">
                <path d="M6 24 4 15M13 20 15 8M19 24l8-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-zinc-600 sm:text-lg">{t("texto")}</p>
          </div>

          <div aria-hidden className="relative hidden h-72 lg:block">
            <Image
              src="/cuenta-empresa/empresario.webp"
              alt=""
              fill
              sizes="20rem"
              className="object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_30%,black_85%,transparent),linear-gradient(to_bottom,black_75%,transparent)] [mask-composite:intersect]"
            />
          </div>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {ventajas.map((ventaja, indice) => (
            <li
              key={ventaja.titulo}
              className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-lg shadow-brand-navy/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-navy/10 sm:p-6"
            >
              <span className="flex-none self-start text-brand-teal-dark sm:self-center">
                <Trazo className="h-9 w-9 sm:h-10 sm:w-10">{ICONOS[indice]}</Trazo>
              </span>
              <span aria-hidden className="hidden h-16 w-px flex-none bg-brand-teal/30 sm:block" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold leading-snug text-titular">{ventaja.titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-600">{ventaja.texto}</p>
              </div>
              <div aria-hidden className="relative hidden h-24 w-28 flex-none sm:block">
                {dibujos[indice]}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/registro-empresa"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-brand-teal-dark to-teal-600 px-6 py-4 text-base font-bold sm:gap-3 sm:px-10 sm:text-lg text-sobre-color shadow-xl shadow-brand-teal/30 transition hover:from-brand-navy hover:to-brand-navy sm:px-10"
          >
            <Trazo className="h-6 w-6">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </Trazo>
            {t("cta")}
            <Trazo className="h-5 w-5 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </Trazo>
          </Link>
          <p className="text-[15px] text-zinc-600">{t("condiciones")}</p>
          <Link
            href="/empresas"
            className="mt-1 text-base font-semibold text-accion-tinta underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
          >
            {t("directorio")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Trazo({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

/** Ficha, megáfono, sobre y marcador: en el orden de `cuenta.ventajas`. */
const ICONOS: ReactNode[] = [
  <g key="ficha">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <circle cx="8.5" cy="11" r="2.2" />
    <path d="M5.5 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14 9.5h4.5M14 12.5h4.5M14 15.5h3" />
  </g>,
  <g key="publicar">
    <path d="m3 11 15-6v14L3 13z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    <path d="M21 9.5v5" />
  </g>,
  <g key="aviso">
    <rect x="2.5" y="6" width="17" height="13" rx="2" />
    <path d="m2.5 8 8.5 6 8.5-6" />
    <circle cx="19.5" cy="5" r="2.5" />
  </g>,
  <path key="favoritos" d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
];

/* ---------- Los dibujos ---------- */

/** El portátil con el panel de la empresa: menú y tres oportunidades. */
function PortatilConPanel() {
  return (
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-3">
      <div className="rounded-t-xl border-[6px] border-b-[8px] border-brand-navy bg-white shadow-2xl shadow-brand-navy/25">
        <div className="flex aspect-[16/10] overflow-hidden rounded-[3px] bg-zinc-50">
          <div className="flex w-[26%] flex-col gap-2 bg-white p-2.5">
            <Image src="/logo-header.png" alt="" width={218} height={48} className="h-auto w-full" />
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`flex items-center gap-1.5 rounded px-1 py-0.5 ${i === 1 ? "bg-brand-teal-light" : ""}`}>
                <span className={`h-2 w-2 rounded-sm ${i === 1 ? "bg-brand-teal-dark" : "bg-zinc-300"}`} />
                <span className={`h-1.5 flex-1 rounded-full ${i === 1 ? "bg-brand-teal-dark/50" : "bg-zinc-200"}`} />
              </span>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <span className="h-2.5 w-2/3 rounded-full bg-brand-navy/70" />
            <div className="grid flex-1 grid-cols-3 gap-2">
              {["futbol", "pabellon", "padel"].map((foto) => (
                <div key={foto} className="flex flex-col gap-1 rounded-md bg-white p-1 shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden rounded">
                    <Image src={`/ejemplos-buscador/${foto}.webp`} alt="" fill sizes="5rem" className="object-cover" />
                  </div>
                  <span className="h-1.5 w-full rounded-full bg-zinc-200" />
                  <span className="h-1.5 w-2/3 rounded-full bg-zinc-200" />
                  <span className="mt-auto h-2 w-1/2 rounded bg-brand-teal-dark/80" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-3 w-[112%] -translate-x-[5.4%] rounded-b-xl bg-gradient-to-b from-zinc-300 to-zinc-400" />
    </div>
  );
}

/** 1: la ficha de la empresa en el directorio. */
function DibujoFicha() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 rounded-2xl bg-brand-teal-light/50" />
      <div className="cuenta-flota absolute inset-x-2 top-2 overflow-hidden rounded-xl bg-white shadow-lg shadow-brand-navy/15 ring-1 ring-zinc-200">
        <div className="flex items-center gap-2 bg-brand-navy px-2 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-teal text-brand-navy">
            <Trazo className="h-4 w-4">
              <path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M2 7h20v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
            </Trazo>
          </span>
          <span className="h-1.5 flex-1 rounded-full bg-white/50" />
        </div>
        <div className="space-y-1.5 p-2">
          <span className="block h-1.5 w-full rounded-full bg-zinc-200" />
          <span className="block h-1.5 w-4/5 rounded-full bg-zinc-200" />
          <span className="block h-2.5 w-1/2 rounded bg-brand-teal-dark" />
        </div>
      </div>
    </div>
  );
}

/** 2: lo que ofreces, en cajas, con el balón al lado. */
function DibujoPublicar() {
  return (
    <svg viewBox="0 0 112 96" className="absolute inset-0 h-full w-full">
      <rect x="6" y="6" width="100" height="84" rx="16" className="fill-brand-teal-light/50" />
      <g className="cuenta-flota">
        <path d="M30 48h34v32H30z" fill="#c8915a" />
        <path d="M30 48h34v7H30z" fill="#b07a45" />
        <path d="M44 48h6v32h-6z" fill="#e2c194" />
        <path d="M44 22h32v26H44z" fill="#d6a06a" />
        <path d="M44 22h32v6H44z" fill="#bd8752" />
        <path d="M57 22h6v26h-6z" fill="#ecd0a6" />
      </g>
      <g className="cuenta-bota">
        <circle cx="82" cy="70" r="15" fill="white" stroke="var(--brand-navy)" strokeWidth="2" />
        <path d="m82 63 5.5 4-2 6.5h-7l-2-6.5z" fill="var(--brand-navy)" />
        <path d="M82 63v-8M87.5 67l7-2.5M85.5 73.5l4 6M78.5 73.5l-4 6M76.5 67l-7-2.5" stroke="var(--brand-navy)" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/** 3: el aviso que llega al correo, con su "1" rojo. */
function DibujoAviso() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 rounded-2xl bg-brand-teal-light/50" />
      <div className="absolute inset-x-3 bottom-4 top-3">
        <div className="h-[80%] rounded-t-lg border-[3px] border-b-[4px] border-brand-navy bg-gradient-to-br from-teal-50 to-white">
          <div className="cuenta-sobre flex h-full items-center justify-center text-brand-teal-dark">
            <Trazo className="h-9 w-9">
              <rect x="3" y="5" width="18" height="14" rx="2" className="fill-white" />
              <path d="m3 7 9 6 9-6" />
            </Trazo>
          </div>
        </div>
        <div className="mx-auto h-1.5 w-[110%] -translate-x-[4.5%] rounded-b bg-zinc-300" />
      </div>
      <span className="cuenta-aviso absolute right-1 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-sobre-color shadow-md ring-2 ring-white">
        1
      </span>
    </div>
  );
}

/** 4: la lista de favoritos, con los corazones. */
function DibujoFavoritos() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 rounded-2xl bg-brand-teal-light/50" />
      <div className="absolute inset-x-2 top-3 space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-white px-2 py-2 shadow-md shadow-brand-navy/10 ring-1 ring-zinc-200">
            <span className="flex-1 space-y-1">
              <span className="block h-1.5 w-full rounded-full bg-zinc-200" />
              <span className="block h-1.5 w-2/3 rounded-full bg-zinc-200" />
            </span>
            <span
              className="cuenta-corazon flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-teal-dark text-sobre-color"
              style={{ animationDelay: `${i * 600}ms` }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
