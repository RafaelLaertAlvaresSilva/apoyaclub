import { Link } from "@/i18n/navigation";

const ENLACES = [
  { id: "perfil", href: "/empresa", etiqueta: "Perfil de empresa" },
  { id: "favoritos", href: "/empresa/favoritos", etiqueta: "Favoritos" },
  { id: "privacidad", href: "/empresa/privacidad", etiqueta: "Privacidad" },
] as const;

type SeccionEmpresa = (typeof ENLACES)[number]["id"];

/** Navegación entre las secciones del panel de empresa (perfil / favoritos / privacidad, Fases 8 y 11). */
export function EmpresaNav({ activo }: { activo: SeccionEmpresa }) {
  return (
    <nav className="flex gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activo === enlace.id
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {enlace.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
