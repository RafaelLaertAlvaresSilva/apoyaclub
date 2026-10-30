import { Link } from "@/i18n/navigation";

const ENLACES = [
  { id: "resumen", href: "/admin", etiqueta: "Resumen", soloAdmin: true },
  { id: "clubes", href: "/admin/clubes", etiqueta: "Clubes", soloAdmin: false },
  { id: "empresas", href: "/admin/empresas", etiqueta: "Empresas", soloAdmin: true },
  { id: "finanzas", href: "/admin/finanzas", etiqueta: "Finanzas", soloAdmin: true },
  { id: "comisiones", href: "/admin/comisiones", etiqueta: "Comisiones", soloAdmin: false },
  { id: "representantes", href: "/admin/representantes", etiqueta: "Representantes", soloAdmin: true },
  { id: "bajas", href: "/admin/bajas", etiqueta: "Bajas", soloAdmin: true },
] as const;

type SeccionAdmin = (typeof ENLACES)[number]["id"];

/**
 * Navegación entre las secciones del panel de administración (Fase 12).
 *
 * Un representante solo ve sus dos secciones: los clubes de su país y
 * su comisión. Las demás tampoco se abren escribiendo la dirección
 * (`soloAdministrador` en cada página): esconder el enlace es solo
 * para que no vea botones que no le sirven.
 */
export function AdminNav({ activo, esAdministrador = true }: { activo: SeccionAdmin; esAdministrador?: boolean }) {
  const enlaces = ENLACES.filter((enlace) => esAdministrador || !enlace.soloAdmin);

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {enlaces.map((enlace) => (
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
          {enlace.id === "comisiones" && !esAdministrador ? "Mi comisión" : enlace.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
