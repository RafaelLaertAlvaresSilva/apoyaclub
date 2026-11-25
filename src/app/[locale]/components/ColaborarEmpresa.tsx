import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/**
 * "Colaborar no siempre es firmar un cheque" en /para-empresas.
 *
 * La sección que dice a la panadería, al fisio o al de la imprenta que
 * lo suyo también vale. Cada forma de colaborar lleva su icono y su
 * foto, para que se reconozca de un vistazo sin leer: el autobús, los
 * conos, las camisetas…
 *
 * Las fotos salen del diseño que hizo Rafael para la sección y son
 * pequeñas a propósito (se ven a la derecha de cada tarjeta, fundidas
 * con el blanco). El orden de `FOTOS_E_ICONOS` es el de
 * `formas.lista` en los mensajes: si se cambia uno, se cambia el otro.
 */
const FOTOS_E_ICONOS: { foto: string; icono: ReactNode }[] = [
  {
    foto: "autobus",
    icono: (
      <>
        <path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
        <circle cx="7" cy="18" r="2" />
        <path d="M9 18h5" />
        <circle cx="16" cy="18" r="2" />
      </>
    ),
  },
  {
    foto: "material",
    icono: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="m12 7.5 4.3 3.1-1.6 5h-5.4l-1.6-5zM12 7.5V2.5M16.3 10.6l4.7-1.6M14.7 15.6l2.9 4M9.3 15.6l-2.9 4M7.7 10.6 3 9" />
      </>
    ),
  },
  {
    foto: "equipaciones",
    icono: <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.2a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.4-2.2z" />,
  },
  {
    foto: "fisio",
    icono: (
      <>
        <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
        <path d="M3.2 12h5.3l1-2 2 4 1.5-3h7.8" />
      </>
    ),
  },
  {
    foto: "comida",
    icono: <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />,
  },
  {
    foto: "imprenta",
    icono: (
      <>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </>
    ),
  },
  {
    foto: "oficio",
    icono: <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.3 2.5a1 1 0 0 1-.9 1.5H3.6a1 1 0 0 1-.9-1.5L4 16" />,
  },
  {
    foto: "local",
    icono: (
      <>
        <path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.6-.6.7.7 0 0 0-.8 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.6-.6.7.7 0 0 0-.8 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.6-.6.7.7 0 0 0-.8 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.6-.6.7.7 0 0 0-.8 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
      </>
    ),
  },
  {
    foto: "aportar",
    icono: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
      </>
    ),
  },
];

/** El apretón de manos de Lucide (licencia ISC), el mismo de otras secciones. */
const ICONO_ACUERDO = (
  <>
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
    <path d="m21 3 1 11h-2" />
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
    <path d="M3 4h8" />
  </>
);

function Trazo({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export async function SeccionColaborarEmpresa() {
  const t = await getTranslations("home.paraEmpresas.formas");
  const formas = t.raw("lista") as string[];
  const titulo = t("titulo");
  const resalta = t("tituloResalta");
  const tieneResalte = !!resalta && titulo.includes(resalta);
  const corte = tieneResalte ? titulo.indexOf(resalta) : titulo.length;
  const antes = titulo.slice(0, corte);
  const despues = tieneResalte ? titulo.slice(corte + resalta.length) : "";

  // El cierre en dos: la primera frase en negrita, el resto debajo.
  const cierre = t("cierre");
  const punto = cierre.indexOf(". ");
  const cierreTitular = punto > 0 ? cierre.slice(0, punto + 1) : cierre;
  const cierreTexto = punto > 0 ? cierre.slice(punto + 2) : "";

  return (
    <section id="colaborar" className="relative scroll-mt-32 overflow-hidden bg-brand-navy px-4 py-20 sm:px-6 sm:py-28">
      {/* Luz de estadio arriba y los jugadores abrazados en la esquina,
          fundidos con el azul. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(45,212,191,0.18),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-80 w-[28rem] lg:block">
        <Image
          src="/formas-de-colaborar/jugadores.webp"
          alt=""
          fill
          sizes="28rem"
          className="object-cover opacity-70 [mask-image:linear-gradient(to_left,black_30%,transparent),linear-gradient(to_bottom,black_45%,transparent)] [mask-composite:intersect]"
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full border border-brand-teal/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-teal">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-sobre-color sm:text-5xl">
            {antes}
            {tieneResalte && (
              <span className="relative inline-block text-brand-teal">
                {resalta}
                <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-brand-teal sm:-bottom-3 sm:h-4">
                  <path d="M3 11C50 4 120 2 197 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {despues}
            <svg aria-hidden viewBox="0 0 30 30" className="relative -top-4 ml-1 inline-block h-6 w-6 text-brand-teal sm:-top-5 sm:h-8 sm:w-8">
              <path d="M6 24 4 15M13 20 15 8M19 24l8-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </h2>
          <p className="mt-5 leading-relaxed text-sobre-color/75 sm:text-lg">{t("texto")}</p>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {formas.map((forma, indice) => {
            const extra = FOTOS_E_ICONOS[indice];
            return (
              <li
                key={forma}
                className="group relative flex h-[5.5rem] items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-teal/20 sm:h-24"
              >
                {extra && (
                  <div aria-hidden className="absolute inset-y-0 right-0 w-[40%]">
                    <Image
                      src={`/formas-de-colaborar/${extra.foto}.webp`}
                      alt=""
                      fill
                      sizes="10rem"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
                  </div>
                )}
                <span className="relative flex h-full flex-none items-center pl-4 pr-3 text-brand-teal-dark sm:pl-5">
                  {extra && <Trazo className="h-8 w-8 transition duration-300 group-hover:scale-110">{extra.icono}</Trazo>}
                </span>
                <span aria-hidden className="relative h-10 w-px flex-none bg-brand-teal/40" />
                <span className="relative min-w-0 flex-1 pl-3 pr-[38%] text-[15px] font-extrabold leading-snug text-titular sm:text-base">
                  {forma}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-10 flex max-w-4xl items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur sm:gap-5 sm:p-6">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-brand-teal text-brand-navy shadow-lg shadow-brand-teal/30">
            <Trazo className="h-8 w-8">{ICONO_ACUERDO}</Trazo>
          </span>
          <span aria-hidden className="hidden h-12 w-px flex-none bg-white/20 sm:block" />
          <p>
            <span className="block text-base font-bold text-sobre-color sm:text-lg">{cierreTitular}</span>
            {cierreTexto && <span className="mt-1 block text-[15px] text-sobre-color/75 sm:text-base">{cierreTexto}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}
