import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const CLAVES_ENLACES_LEGALES = [
  { href: "/aviso-legal", clave: "avisoLegal" },
  { href: "/privacidad", clave: "privacidad" },
  { href: "/cookies", clave: "cookies" },
  { href: "/condiciones-de-uso", clave: "condicionesDeUso" },
] as const;

/**
 * Pie de página sitewide (Fase 11): enlaces a las páginas legales,
 * presentes en toda la app.
 *
 * Fase 14: primer componente migrado a next-intl, como ejemplo del
 * patrón a seguir con el resto: los textos viven en
 * `messages/es/common.json` (espacio de nombres `footer`) y aquí solo
 * se referencian con `t(...)`, nunca escritos sueltos en el JSX.
 */
export function Footer() {
  const t = useTranslations("common.footer");

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {t("derechos")}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {CLAVES_ENLACES_LEGALES.map((enlace) => (
            <Link key={enlace.href} href={enlace.href} className="hover:text-zinc-900 hover:underline">
              {t(`enlaces.${enlace.clave}`)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
