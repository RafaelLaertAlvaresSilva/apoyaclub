import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/**
 * "Cómo funciona para ti" en /para-empresas: los tres pasos de la
 * empresa (mira, escribe, se ponen de acuerdo) y el recuadro de que no
 * hace falta cuenta.
 *
 * Los dibujos de los dos primeros pasos están hechos aquí con cajas y
 * trazos, no son fotos: pesan nada, se ven nítidos en cualquier pantalla
 * y sus piezas se pueden mover (los iconos flotan, el sobre "sale"). El
 * tercero es una foto de verdad, el apretón de manos, porque un acuerdo
 * entre dos personas no se dibuja con iconos. Los movimientos están en
 * `globals.css` ("CÓMO FUNCIONA PARA TI") y con "reducir movimiento" se
 * quedan quietos.
 */
export async function SeccionComoFuncionaEmpresa() {
  const t = await getTranslations("home.paraEmpresas");
  const pasos = t.raw("pasos") as { titulo: string; texto: string }[];
  const titulo = t("comoTitulo");
  const resalta = t("comoTituloResalta");
  // La palabra subrayada ("funciona"). Si en algún idioma no aparece
  // tal cual en el titular, el titular sale entero y sin subrayado.
  const tieneResalte = !!resalta && titulo.includes(resalta);
  const corteTitulo = tieneResalte ? titulo.indexOf(resalta) : titulo.length;
  const antes = titulo.slice(0, corteTitulo);
  const despues = tieneResalte ? titulo.slice(corteTitulo + resalta.length) : "";

  // El cierre en dos partes: la primera frase en grande, el resto debajo.
  const cierre = t("comoCierre");
  const corte = cierre.indexOf(". ");
  const cierreTitular = corte > 0 ? cierre.slice(0, corte + 1) : cierre;
  const cierreTexto = corte > 0 ? cierre.slice(corte + 2) : "";

  const dibujos = [<DibujoMirar key="1" />, <DibujoEscribir key="2" />, <DibujoAcuerdo key="3" />];

  return (
    <section id="como" className="relative scroll-mt-32 overflow-hidden bg-gradient-to-b from-white via-zinc-50 to-teal-50/50 px-4 py-20 sm:px-6 sm:py-28">
      {/* El balón en la esquina, fundido con el fondo. Solo en pantallas
          anchas: en el móvil taparía el titular. */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 hidden h-[26rem] w-[26rem] lg:block">
        <Image
          src="/como-funciona/balon.webp"
          alt=""
          fill
          sizes="26rem"
          className="object-cover opacity-80 [mask-image:radial-gradient(circle_at_60%_40%,black_35%,transparent_70%)]"
        />
      </div>
      {/* La ola de abajo, del color de la marca. */}
      <svg aria-hidden viewBox="0 0 1440 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-brand-teal/15">
        <path fill="currentColor" d="M0 120C240 60 480 40 720 80s480 60 720-20v100H0z" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-brand-teal-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accion-tinta">
            {t("comoEyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-titular sm:text-5xl">
            {antes}
            {tieneResalte && (
              <span className="relative inline-block">
                {resalta}
                <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className="como-subrayado absolute -bottom-2 left-0 h-3 w-full text-brand-teal-dark sm:-bottom-3 sm:h-4">
                  <path d="M3 11C50 4 120 2 197 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {despues}
            <svg aria-hidden viewBox="0 0 30 30" className="como-chispas relative -top-4 ml-1 inline-block h-6 w-6 text-brand-teal-dark sm:-top-6 sm:h-8 sm:w-8">
              <path d="M6 24 4 15M13 20 15 8M19 24l8-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {pasos.map((paso, indice) => (
            <li
              key={paso.titulo}
              className="group relative flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-lg shadow-brand-navy/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-navy/10 sm:p-7"
            >
              <span className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal-dark text-lg font-extrabold text-sobre-color shadow-md shadow-brand-teal/30 ring-4 ring-white">
                {indice + 1}
              </span>
              <div className="relative h-44 sm:h-48">{dibujos[indice]}</div>
              <h3 className="mt-5 text-xl font-extrabold leading-snug text-titular">{paso.titulo}</h3>
              <p className="mt-2 text-base leading-relaxed text-zinc-600">{paso.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 flex max-w-3xl items-center gap-5 rounded-3xl border border-brand-teal/30 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <span className="relative flex h-14 w-16 flex-none items-center justify-center">
            <PortatilPequeno />
          </span>
          <span className="hidden h-12 w-px flex-none bg-zinc-200 sm:block" />
          <p>
            <span className="block text-lg font-extrabold text-titular">{cierreTitular}</span>
            {cierreTexto && <span className="mt-0.5 block text-base text-zinc-600">{cierreTexto}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Los dibujos ---------- */

function Flota({ className, retraso = 0, children }: { className: string; retraso?: number; children: ReactNode }) {
  return (
    <span
      className={`como-flota absolute flex items-center justify-center rounded-2xl shadow-lg ${className}`}
      style={{ "--retraso": `${retraso}ms` } as CSSProperties}
    >
      {children}
    </span>
  );
}

function Trazo({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

/** Un portátil: la pantalla (con lo que se le pase dentro) y la base. */
function Portatil({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="rounded-t-xl border-[5px] border-b-[7px] border-brand-navy bg-white shadow-xl shadow-brand-navy/20">
        <div className="aspect-[16/10] overflow-hidden rounded-[3px] bg-zinc-50">{children}</div>
      </div>
      <div className="mx-auto h-2.5 w-[112%] -translate-x-[5.4%] rounded-b-xl bg-gradient-to-b from-zinc-300 to-zinc-400" />
    </div>
  );
}

/** Paso 1: el buscador, con el lugar, el deporte y el público flotando. */
function DibujoMirar() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-x-6 bottom-2 top-8 rounded-[2.5rem] bg-brand-teal-light/60" />
      <Portatil className="bottom-3 left-[12%] w-[62%] -rotate-3">
        <div className="flex h-full flex-col bg-gradient-to-br from-brand-teal-dark to-brand-navy p-3">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
          <div className="mt-auto mb-auto flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-2">
            <Trazo className="h-5 w-5 flex-none text-brand-teal-dark">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </Trazo>
            <span className="flex-1 space-y-1">
              <span className="como-escribe block h-1.5 rounded-full bg-zinc-300" />
              <span className="block h-1.5 w-2/3 rounded-full bg-zinc-200" />
            </span>
          </div>
        </div>
      </Portatil>
      <Flota className="right-[14%] top-2 h-11 w-11 bg-brand-teal-dark text-sobre-color" retraso={0}>
        <Trazo>
          <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </Trazo>
      </Flota>
      <Flota className="right-[6%] top-[42%] h-11 w-11 bg-white text-brand-teal-dark ring-1 ring-zinc-200" retraso={700}>
        <Trazo>
          <circle cx="12" cy="12" r="9.5" />
          <path d="m12 7.5 4.3 3.1-1.6 5h-5.4l-1.6-5zM12 7.5V2.5M16.3 10.6l4.7-1.6M14.7 15.6l2.9 4M9.3 15.6l-2.9 4M7.7 10.6 3 9" />
        </Trazo>
      </Flota>
      <Flota className="bottom-1 right-[16%] h-11 w-11 bg-brand-teal text-sobre-color" retraso={1400}>
        <Trazo>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </Trazo>
      </Flota>
    </div>
  );
}

/** Paso 2: la página del club en el portátil y el mensaje saliendo. */
function DibujoEscribir() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-x-6 bottom-2 top-8 rounded-[2.5rem] bg-brand-teal-light/60" />
      <Portatil className="bottom-3 left-[10%] w-[64%] -rotate-2">
        <div className="flex h-full flex-col">
          <div className="h-2.5 bg-brand-navy" />
          <div className="flex flex-1 gap-2 p-2">
            <div className="flex w-[30%] flex-col items-center justify-center rounded-md bg-gradient-to-b from-brand-teal-dark to-brand-navy text-sobre-color">
              <Trazo className="h-6 w-6">
                <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </Trazo>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="relative h-[55%] overflow-hidden rounded-md">
                <Image src="/ejemplos-buscador/futbol.webp" alt="" fill sizes="10rem" className="object-cover" />
              </div>
              <span className="h-1.5 w-full rounded-full bg-zinc-300" />
              <span className="h-1.5 w-3/4 rounded-full bg-zinc-200" />
              <span className="mt-auto h-3 w-1/2 self-end rounded bg-brand-teal-dark" />
            </div>
          </div>
        </div>
      </Portatil>
      <span className="como-sobre absolute right-[8%] top-[18%] flex h-14 w-16 items-center justify-center rounded-2xl bg-white text-brand-teal-dark shadow-xl shadow-brand-navy/15 ring-1 ring-zinc-200">
        <Trazo className="h-7 w-7">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </Trazo>
        <span className="absolute -right-4 -top-4 text-brand-teal-dark">
          <Trazo className="h-6 w-6">
            <path d="M5 9 3 5M10 7l1-5M14 10l5-3" />
          </Trazo>
        </span>
      </span>
    </div>
  );
}

/** Paso 3: el apretón de manos entre la empresa (traje) y el club (chándal). */
function DibujoAcuerdo() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-x-6 bottom-2 top-8 rounded-[2.5rem] bg-brand-teal-light/60" />
      <div className="absolute inset-x-4 bottom-3 top-4 overflow-hidden rounded-2xl shadow-xl shadow-brand-navy/20">
        <Image
          src="/como-funciona/acuerdo.webp"
          alt=""
          fill
          sizes="(min-width: 768px) 22rem, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <span className="como-tic absolute bottom-0 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal-dark text-sobre-color shadow-lg ring-4 ring-white">
        <Trazo className="h-6 w-6">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </Trazo>
      </span>
      <span className="absolute right-[22%] top-0 text-brand-teal-dark">
        <Trazo className="h-7 w-7">
          <path d="M6 9 4 4M12 7V1M18 9l3-5" />
        </Trazo>
      </span>
    </div>
  );
}

/** El portátil con el tic del recuadro de "no hace falta cuenta". */
function PortatilPequeno() {
  return (
    <svg viewBox="0 0 64 52" className="h-14 w-16" aria-hidden>
      <rect x="9" y="4" width="46" height="32" rx="3" fill="white" stroke="var(--brand-navy)" strokeWidth="3.5" />
      <path d="M3 41h58l-4 6H7z" fill="var(--brand-navy)" />
      <circle cx="32" cy="20" r="9" fill="var(--brand-teal-dark)" />
      <path d="m27.5 20 3 3 6-6" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
