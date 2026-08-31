import Link from "next/link";

const ENLACES = [
  { id: "resumen", href: "/admin", etiqueta: "Resumen" },
  { id: "clubes", href: "/admin/clubes", etiqueta: "Clubes" },
  { id: "empresas", href: "/admin/empresas", etiqueta: "Empresas" },
] as const;

type SeccionAdmin = (typeof ENLACES)[number]["id"];

/** Navegación entre las secciones del panel de administración (Fase 12). */
export function AdminNav({ activo }: { activo: SeccionAdmin }) {
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
