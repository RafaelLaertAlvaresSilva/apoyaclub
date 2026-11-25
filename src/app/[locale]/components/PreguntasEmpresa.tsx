import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/**
 * "Preguntas frecuentes" en /para-empresas, con el diseño de Rafael.
 *
 * Siguen siendo `<details>`: se abren y se cierran sin JavaScript y
 * Google lee las respuestas aunque estén cerradas (las mismas preguntas
 * van en los datos estructurados de la página). La primera sale
 * abierta, porque es la que todo el mundo tiene: "¿me cobráis algo?".
 *
 * Cada pregunta lleva su icono. El orden de `ICONOS` es el de
 * `faq.preguntas` en los mensajes: si se cambia uno, se cambia el otro.
 * Iconos de Lucide (licencia ISC), cada uno en su `<g>` con clave.
 */
const ICONOS: ReactNode[] = [
  // ¿Me cobráis algo? → euro tachado
  <g key="cobro">
    <circle cx="12" cy="12" r="10" />
    <path d="M7 10.5h6.5M7 13.5h5M16 8.2a4.6 4.6 0 0 0-3-1.2 5 5 0 0 0 0 10 4.6 4.6 0 0 0 3-1.2" />
    <path d="M4.9 4.9l14.2 14.2" />
  </g>,
  // ¿Comisión? → apretón de manos
  <g key="comision">
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
    <path d="m21 3 1 11h-2" />
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
    <path d="M3 4h8" />
  </g>,
  // ¿Registrarme? → persona con un más
  <g key="registro">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </g>,
  // ¿Un servicio en vez de dinero? → caja
  <g key="servicio">
    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
    <path d="M12 22V12M3.29 7 12 12l8.71-5M7.5 4.27l9 5.15" />
  </g>,
  // ¿Existe de verdad? → escudo con tic
  <g key="existe">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </g>,
  // ¿Quitar mi ficha? → lápiz sobre un cuadro
  <g key="ficha">
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
  </g>,
];

/** El balón de baloncesto de la esquina, dibujado para que se vea nítido. */
function BalonDeBaloncesto({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="balon-luz" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="55%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#balon-luz)" />
      <g fill="none" stroke="#3b1a0b" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="50" cy="50" r="47" />
        <path d="M3 50h94M50 3v94" />
        <path d="M17 15c14 12 14 58 0 70M83 15c-14 12-14 58 0 70" />
      </g>
    </svg>
  );
}

export async function SeccionPreguntasEmpresa() {
  const t = await getTranslations("home.paraEmpresas.faq");
  const preguntas = t.raw("preguntas") as { pregunta: string; respuesta: string }[];
  const titulo = t("titulo");
  const resalta = t("tituloResalta");
  const tieneResalte = !!resalta && titulo.includes(resalta);
  const corte = tieneResalte ? titulo.indexOf(resalta) : titulo.length;
  const antes = titulo.slice(0, corte);
  const despues = tieneResalte ? titulo.slice(corte + resalta.length) : "";

  return (
    <section id="faq" className="relative scroll-mt-32 overflow-hidden bg-sky-50 px-4 py-20 sm:px-6 sm:py-28">
      {/* El estadio desenfocado de fondo, casi blanco, como en el diseño. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image src="/fondo-clubes.webp" alt="" fill sizes="100vw" className="object-cover opacity-25 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-sky-50/70 to-white/90" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -left-28 top-1/3 hidden h-72 w-72 rounded-full bg-brand-teal/25 blur-2xl lg:block" />
      <div aria-hidden className="pointer-events-none absolute -left-12 bottom-16 hidden lg:block">
        <BalonDeBaloncesto className="faq-bota h-44 w-44 drop-shadow-2xl" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-teal/15 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="inline-flex items-center gap-3 text-3xl font-extrabold tracking-tight text-titular sm:gap-4 sm:text-5xl">
            <span aria-hidden className="faq-burbuja relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-brand-teal-dark text-2xl font-black text-sobre-color shadow-lg shadow-brand-teal/30 sm:h-14 sm:w-14 sm:text-3xl">
              ?
              <span className="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 rounded-sm bg-brand-teal-dark" />
            </span>
            <span>
              {antes}
              {tieneResalte && (
                <span className="relative inline-block">
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
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-zinc-600 sm:text-lg">{t("texto")}</p>
        </div>

        <ul className="mt-12 space-y-3 sm:space-y-4">
          {preguntas.map((item, indice) => (
            <li key={item.pregunta}>
              <details
                open={indice === 0}
                className="group rounded-2xl border border-zinc-200/80 bg-white/95 shadow-sm shadow-brand-navy/5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-teal/10 open:border-brand-teal/40 open:shadow-lg open:shadow-brand-teal/10"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:content-none sm:gap-4 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="flex-none text-brand-teal-dark transition duration-300 group-hover:scale-110 group-open:scale-110">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      {ICONOS[indice]}
                    </svg>
                  </span>
                  <span aria-hidden className="h-8 w-px flex-none bg-brand-teal/40" />
                  <span className="min-w-0 flex-1 text-base font-bold text-titular sm:text-lg">{item.pregunta}</span>
                  <span aria-hidden className="relative h-5 w-5 flex-none text-brand-teal-dark">
                    <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current" />
                    <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded bg-current transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <div className="faq-respuesta px-4 pb-4 sm:px-6 sm:pb-5">
                  <p className="rounded-xl bg-brand-teal-light/60 px-4 py-3 text-[15px] leading-relaxed text-zinc-700 sm:px-5 sm:py-4 sm:text-base">
                    {item.respuesta}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
