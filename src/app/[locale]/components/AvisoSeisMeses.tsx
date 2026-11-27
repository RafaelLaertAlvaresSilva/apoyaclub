import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { paisDelIdioma } from "@/lib/paises";
import { MESES_PILOTO, PLAZAS_PILOTO, plazasPilotoLibres } from "@/lib/piloto";
import { createAdminClient } from "@/lib/supabase/admin";
import { CtaFijoMovil } from "./CtaFijoMovil";
import { TarjetaCerrable } from "./TarjetaCerrable";

/**
 * Los 6 meses gratis, recordados en la portada y en "Para clubes".
 *
 * Quien vio el anuncio y días después escribe apoyaclub.com a mano no
 * pasa por /6mesesgratis: sin esto vería "1 mes gratis", se registraría
 * desde aquí y recibiría 30 días. Con esto llega a la página de la
 * campaña, que es la única que da los 6 meses.
 *
 * Los dos avisos llevan `?a=WEB` para que el panel de administrador
 * distinga a quien llega desde la propia web de quien llega del anuncio.
 *
 * Desaparecen solos cuando se llenan las plazas, y también si no se
 * puede saber cuántas quedan: mejor no anunciar nada que anunciar plazas
 * que ya no hay.
 */
const ENLACE = "/6mesesgratis?a=WEB";

async function plazasLibres(): Promise<number | null> {
  try {
    // Las plazas del país de la página: en /br, las de Brasil.
    return await plazasPilotoLibres(createAdminClient(), paisDelIdioma(await getLocale()));
  } catch {
    return null;
  }
}

/** La franja fina de debajo de la cabecera. */
export async function FranjaSeisMeses() {
  const libres = await plazasLibres();
  if (!libres) return null;

  const t = await getTranslations("home.piloto");

  return (
    <Link
      href={ENLACE}
      className="group block bg-brand-teal-dark px-4 py-2.5 text-center text-sobre-color transition-colors hover:bg-brand-navy sm:px-6"
    >
      {/* Dos versiones del texto: la larga en el ordenador y una corta
          en el teléfono, para que la franja quepa en una sola línea. */}
      {/* El regalo, como en el diseño de Rafael (Lucide, licencia ISC). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mr-2 inline-block size-5 -translate-y-px align-middle"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </svg>
      <span className="text-[15px] font-bold">
        <span className="hidden sm:inline">{t("titulo", { meses: MESES_PILOTO })}</span>
        <span className="sm:hidden">{t("franjaCorta", { meses: MESES_PILOTO })}</span>
      </span>
      <span aria-hidden="true" className="mx-2 opacity-60">
        ·
      </span>
      <span className="text-[15px]">
        <span className="hidden sm:inline">{t("plazasQuedan", { n: libres, total: PLAZAS_PILOTO })}</span>
        <span className="sm:hidden">{t("plazasCorto", { n: libres })}</span>
      </span>
      {/* En el teléfono basta con la frase y la flecha: el botón con
          texto haría la franja de dos líneas. */}
      <span className="ml-3 hidden rounded-full bg-sobre-color px-3 py-1 text-sm font-bold text-accion-tinta sm:inline-block">
        {t("cta")} →
      </span>
      <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1 sm:hidden">
        →
      </span>
    </Link>
  );
}

/**
 * La imagen de la campaña como tarjeta, solo en el ordenador y solo en
 * español: el texto va dentro de la imagen, y en un teléfono no se lee.
 * Lleva una X para cerrarla (`TarjetaCerrable`).
 */
export async function TarjetaSeisMeses() {
  const locale = await getLocale();
  if (locale !== "es") return null;
  const libres = await plazasLibres();
  if (!libres) return null;

  const t = await getTranslations("home.piloto");

  return (
    <section className="hidden bg-zinc-50 px-6 pt-16 lg:block">
      <TarjetaCerrable etiquetaCerrar={t("cerrarTarjeta")}>
      <Link
        href={ENLACE}
        className="block overflow-hidden rounded-3xl shadow-xl shadow-brand-navy/10 transition-transform hover:-translate-y-1 focus-visible:outline-accion-tinta"
      >
        <Image
          src="/6meses-tarjeta.webp"
          alt={t("tarjetaAlt", { meses: MESES_PILOTO, plazas: PLAZAS_PILOTO })}
          width={1774}
          height={887}
          sizes="(min-width: 1152px) 72rem, 100vw"
          className="block h-auto w-full"
        />
      </Link>
      </TarjetaCerrable>
    </section>
  );
}

/**
 * El botón fijo de abajo en el teléfono (portada y "Para clubes").
 *
 * Mientras quedan plazas de los 6 meses, lleva a su página y lo dice: con
 * la franja de arriba anunciando "6 meses gratis" y este botón diciendo
 * "Prueba 1 mes gratis", un club no sabía cuál de los dos era (decidido
 * por Rafael el 27-11-2026: hasta completar los 20 clubes). Cuando se
 * llenan, vuelve a ser el de siempre.
 */
export async function CtaFijoSegunPlazas() {
  const [libres, tHome] = await Promise.all([plazasLibres(), getTranslations("home")]);
  if (libres) {
    return (
      <CtaFijoMovil
        href={ENLACE}
        texto={tHome("ctaFijo.seisMeses", { meses: MESES_PILOTO })}
        condiciones={tHome("ctaFijo.seisMesesCondiciones", { n: libres })}
      />
    );
  }
  return <CtaFijoMovil texto={tHome("ctaFijo.texto")} condiciones={tHome("ctaFinal.condiciones")} />;
}
