import { Link } from "@/i18n/navigation";

const ENLACES = [
  { id: "perfil", href: "/panel", etiqueta: "Perfil del club" },
  { id: "oportunidades", href: "/panel/oportunidades", etiqueta: "Oportunidades" },
  { id: "solicitudes", href: "/panel/solicitudes", etiqueta: "Solicitudes" },
  { id: "dossier", href: "/panel/dossier", etiqueta: "Dossier PDF" },
  { id: "suscripcion", href: "/panel/suscripcion", etiqueta: "Suscripción" },
  { id: "privacidad", href: "/panel/privacidad", etiqueta: "Privacidad" },
] as const;

type SeccionPanel = (typeof ENLACES)[number]["id"];

/** Navegación entre las secciones del panel del club (perfil / oportunidades / solicitudes / dossier / suscripción / privacidad, Fases 6, 8, 9, 10 y 11). */
export function PanelNav({ activo }: { activo: SeccionPanel }) {
  return (
    <nav className="flex gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => (
        <Link
          key={enlace.id}
          href={enlace.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activo === enlace.id
              ? "bg-teal-700 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {enlace.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
