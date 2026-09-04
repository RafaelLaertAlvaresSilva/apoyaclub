import { Link } from "@/i18n/navigation";
import { contarSolicitudesNuevas } from "@/lib/contact-requests";

const ENLACES = [
  { id: "perfil", href: "/panel", etiqueta: "Perfil del club" },
  { id: "oportunidades", href: "/panel/oportunidades", etiqueta: "Oportunidades" },
  { id: "solicitudes", href: "/panel/solicitudes", etiqueta: "Solicitudes" },
  { id: "dossier", href: "/panel/dossier", etiqueta: "Dossier PDF" },
  { id: "suscripcion", href: "/panel/suscripcion", etiqueta: "Suscripción" },
  { id: "privacidad", href: "/panel/privacidad", etiqueta: "Privacidad" },
] as const;

type SeccionPanel = (typeof ENLACES)[number]["id"];

/**
 * Navegación entre las secciones del panel del club.
 *
 * "Solicitudes" lleva un contador de las que están sin abrir. Sin él, la
 * única forma de enterarse de que una empresa te ha escrito era entrar a
 * mirar por si acaso: una empresa interesada podía estar esperando
 * semanas sin que el club llegara a saberlo.
 */
export async function PanelNav({ activo }: { activo: SeccionPanel }) {
  const sinAbrir = await contarSolicitudesNuevas();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activo === enlace.id ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {enlace.etiqueta}
          {enlace.id === "solicitudes" && sinAbrir > 0 && (
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
