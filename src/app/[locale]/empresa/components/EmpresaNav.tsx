import { Link } from "@/i18n/navigation";
import { contarPropuestasNuevas } from "@/lib/propuestas";

const ENLACES = [
  { id: "perfil", href: "/empresa", etiqueta: "Perfil de empresa" },
  { id: "propuestas", href: "/empresa/propuestas", etiqueta: "Clubes que te escriben" },
  { id: "favoritos", href: "/empresa/favoritos", etiqueta: "Favoritos" },
  { id: "privacidad", href: "/empresa/privacidad", etiqueta: "Privacidad" },
] as const;

type SeccionEmpresa = (typeof ENLACES)[number]["id"];

/**
 * Navegación del panel de empresa.
 *
 * "Clubes que te escriben" lleva contador de las que están sin abrir,
 * por el mismo motivo que en el panel del club: sin él, la única forma
 * de enterarse de que alguien te ha escrito es entrar a mirar por si
 * acaso.
 */
export async function EmpresaNav({ activo }: { activo: SeccionEmpresa }) {
  const sinAbrir = await contarPropuestasNuevas();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activo === enlace.id
              ? "bg-teal-700 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {enlace.etiqueta}
          {enlace.id === "propuestas" && sinAbrir > 0 && (
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activo === enlace.id ? "bg-white text-teal-700" : "bg-red-600 text-white"
              }`}
              aria-label={`${sinAbrir} sin abrir`}
            >
              {sinAbrir}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
