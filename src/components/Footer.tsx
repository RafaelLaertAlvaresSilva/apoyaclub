import Link from "next/link";

const ENLACES_LEGALES = [
  { href: "/aviso-legal", etiqueta: "Aviso legal" },
  { href: "/privacidad", etiqueta: "Privacidad" },
  { href: "/cookies", etiqueta: "Cookies" },
  { href: "/condiciones-de-uso", etiqueta: "Condiciones de uso" },
] as const;

/** Pie de página sitewide (Fase 11): enlaces a las páginas legales, presentes en toda la app. */
export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ApoyaClub</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {ENLACES_LEGALES.map((enlace) => (
            <Link key={enlace.href} href={enlace.href} className="hover:text-zinc-900 hover:underline">
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
