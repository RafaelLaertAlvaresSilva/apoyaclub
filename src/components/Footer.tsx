import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SelectorDeIdioma } from "@/components/SelectorDeIdioma";

// Cada columna apunta a la página de su público, no a la portada. La
// portada solo pregunta cuál de los dos eres; el detalle está en
// `/para-clubes` y `/para-empresas`.
const ENLACES_CLUBES = [
  { href: "/para-clubes#como-funciona", clave: "comoFunciona" },
  { href: "/para-clubes#precio", clave: "precios" },
  { href: "/registro-club", clave: "crearPagina" },
  // Desde el lado del club, el directorio de empresas es a quién
  // escribir (migración 0046).
  { href: "/empresas", clave: "empresasQueAyudan" },
  { href: "/para-clubes#faq", clave: "faq" },
] as const;

const ENLACES_EMPRESAS = [
  { href: "/buscar", clave: "buscarClubes" },
  // La página que mejor encaja con el cliente más probable —el comercio
  // de barrio sin presupuesto de marketing— no estaba enlazada ni aquí
  // ni en la cabecera. Estaba construida la puerta y faltaba el cartel.
  { href: "/servicios", clave: "queNecesitan" },
  { href: "/para-empresas#como", clave: "comoFunciona" },
  { href: "/para-empresas", clave: "accesoGratuito" },
  { href: "/registro-empresa", clave: "publicarOferta" },
] as const;

const ENLACES_LEGALES = [
  { href: "/aviso-legal", clave: "avisoLegal" },
  { href: "/privacidad", clave: "privacidad" },
  { href: "/cookies", clave: "cookies" },
  { href: "/condiciones-de-uso", clave: "condicionesDeUso" },
] as const;

/**
 * Pie de página sitewide (Fase 11, rediseño Fase 15): antes solo
 * enlaces legales en una fila; ahora también enlaces a las secciones
 * de la landing para clubes/empresas, siguiendo la maqueta aprobada.
 * Los enlaces de "para clubes/empresas" a la landing usan `/#ancla`
 * (funcionan desde cualquier página, no solo desde la propia landing).
 *
 * Fase 14: sigue el patrón next-intl iniciado en este componente: los
 * textos viven en `messages/es/common.json` (espacio de nombres
 * `footer`), nunca escritos sueltos en el JSX.
 */
/*
 * LA ZONA PULSABLE. Cada enlace mide 44 px de alto en el móvil (36 en
 * pantallas anchas), aunque la letra sea pequeña: con el texto solo y
 * 10 px de hueco entre uno y otro, en un teléfono era fácil pulsar
 * "Privacidad" queriendo "Cookies". El alto lo pone el propio enlace
 * (`min-h-11`), no el hueco entre ellos, para que el dedo acierte en
 * toda la franja y no solo encima de las letras.
 */
export function Footer() {
  const t = useTranslations("common.footer");

  return (
    <footer className="border-t border-zinc-200 bg-brand-navy-dark print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 border-b border-sobre-color/10 pb-11 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-extrabold text-sobre-color">{t("apoyaclub")}</p>
            <p className="mt-3 max-w-xs text-sm text-sobre-color/55">{t("descripcion")}</p>
            <Link href="/para-clubes#contacto" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-sobre-color/70 hover:text-sobre-color">
              {t("contacto")}
            </Link>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-sobre-color">{t("clubes.titulo")}</p>
            <div className="flex flex-col items-start">
              {ENLACES_CLUBES.map((enlace) => (
                <Link key={enlace.clave} href={enlace.href} className="inline-flex min-h-11 items-center text-sm text-sobre-color/55 hover:text-sobre-color sm:min-h-9">
                  {t(`clubes.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-sobre-color">{t("empresas.titulo")}</p>
            <div className="flex flex-col items-start">
              {ENLACES_EMPRESAS.map((enlace) => (
                <Link key={enlace.clave} href={enlace.href} className="inline-flex min-h-11 items-center text-sm text-sobre-color/55 hover:text-sobre-color sm:min-h-9">
                  {t(`empresas.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-sobre-color">{t("legalTitulo")}</p>
            <div className="flex flex-col items-start">
              {ENLACES_LEGALES.map((enlace) => (
                <Link key={enlace.href} href={enlace.href} className="inline-flex min-h-11 items-center text-sm text-sobre-color/55 hover:text-sobre-color sm:min-h-9">
                  {t(`enlaces.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-sobre-color/65">
            © {new Date().getFullYear()} {t("derechos")}. {t("derechosReservados")}
          </p>
          <SelectorDeIdioma />
        </div>
      </div>
    </footer>
  );
}
