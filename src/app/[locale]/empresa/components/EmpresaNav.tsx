import { Link } from "@/i18n/navigation";

const ENLACES = [
  { id: "ofertas", href: "/empresa", etiqueta: "Lo que ofrezco" },
  { id: "ficha", href: "/empresa/ficha", etiqueta: "Mi ficha" },
] as const;

export type SeccionEmpresa = (typeof ENLACES)[number]["id"];

/** Navegación entre las secciones del panel de empresa. */
export function EmpresaNav({ activo }: { activo: SeccionEmpresa }) {
  return (
    <nav className="flex gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activo === enlace.id ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {enlace.etiqueta}
        </Link>
      ))}

      <Link
        href="/buscar"
        className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-brand-teal-dark hover:bg-zinc-100"
      >
        Buscar clubes
      </Link>
    </nav>
  );
}
