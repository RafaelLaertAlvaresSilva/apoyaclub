import { Link } from "@/i18n/navigation";

const ENLACES = [
  { id: "resumen", href: "/admin", etiqueta: "Resumen" },
  { id: "clubes", href: "/admin/clubes", etiqueta: "Clubes" },
  { id: "empresas", href: "/admin/empresas", etiqueta: "Empresas" },
  { id: "finanzas", href: "/admin/finanzas", etiqueta: "Finanzas" },
  { id: "bajas", href: "/admin/bajas", etiqueta: "Bajas" },
] as const;

type SeccionAdmin = (typeof ENLACES)[number]["id"];

/** Navegación entre las secciones del panel de administración (Fase 12). */
export function AdminNav({ activo }: { activo: SeccionAdmin }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          // Todas con forma de botón, no solo la activa: sobre el fondo
          // gris, las otras parecían texto suelto y no se veía que se
          // pudieran pulsar.
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
            activo === enlace.id
              ? "border-transparent bg-accion text-sobre-color"
              : "border-zinc-300 bg-white text-zinc-700 hover:border-accion-tinta hover:text-accion-tinta"
          }`}
        >
          {enlace.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
