import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ENLACES_CLUBES = [
  { href: "/#como-funciona", clave: "comoFunciona" },
  { href: "/#precio", clave: "precios" },
  { href: "/registro-club", clave: "crearPagina" },
  { href: "/#faq", clave: "faq" },
] as const;

const ENLACES_EMPRESAS = [
  { href: "/buscar", clave: "buscarClubes" },
  { href: "/#como-funciona", clave: "comoFunciona" },
  { href: "/#empresas", clave: "accesoGratuito" },
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
export function Footer() {
  const t = useTranslations("common.footer");

  return (
    <footer className="border-t border-zinc-200 bg-brand-navy-dark">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 border-b border-white/10 pb-11 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-extrabold text-white">ApoyaClub</p>
            <p className="mt-3 max-w-xs text-sm text-white/55">{t("descripcion")}</p>
            <Link href="/#contacto" className="mt-4 inline-block text-sm font-medium text-white/70 hover:text-white">
              {t("contacto")}
            </Link>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-white">{t("clubes.titulo")}</p>
            <div className="flex flex-col gap-2.5">
              {ENLACES_CLUBES.map((enlace) => (
                <Link key={enlace.clave} href={enlace.href} className="text-sm text-white/55 hover:text-white">
                  {t(`clubes.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-white">{t("empresas.titulo")}</p>
            <div className="flex flex-col gap-2.5">
              {ENLACES_EMPRESAS.map((enlace) => (
                <Link key={enlace.clave} href={enlace.href} className="text-sm text-white/55 hover:text-white">
                  {t(`empresas.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-sm font-bold text-white">{t("legalTitulo")}</p>
            <div className="flex flex-col gap-2.5">
              {ENLACES_LEGALES.map((enlace) => (
                <Link key={enlace.href} href={enlace.href} className="text-sm text-white/55 hover:text-white">
                  {t(`enlaces.${enlace.clave}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {t("derechos")}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
