import { Link } from "@/i18n/navigation";
import { contarSolicitudesNuevas } from "@/lib/contact-requests";
import { contarTareasVencidas } from "@/lib/tareas-datos";

const ENLACES = [
  { id: "perfil", href: "/panel", etiqueta: "Perfil del club" },
  { id: "patrocinadores", href: "/panel/patrocinadores", etiqueta: "Patrocinadores" },
  { id: "tareas", href: "/panel/tareas", etiqueta: "Tareas" },
  { id: "oportunidades", href: "/panel/oportunidades", etiqueta: "Oportunidades" },
  // La libreta de empresas a las que el club quiere escribir
  // (migración 0041). Va pegada a Oportunidades porque es el paso
  // siguiente: ya sabes qué ofreces, ahora a quién.
  { id: "objetivos", href: "/panel/objetivos", etiqueta: "A quién escribir" },
  // El recuento de gente en los partidos (migración 0037): de aquí sale
  // la asistencia media que enseña la ficha.
  { id: "publico", href: "/panel/publico", etiqueta: "Público" },
  { id: "solicitudes", href: "/panel/solicitudes", etiqueta: "Solicitudes" },
  // Ya no es solo PDF: también sale en Word.
  { id: "dossier", href: "/panel/dossier", etiqueta: "Dossier" },
  { id: "suscripcion", href: "/panel/suscripcion", etiqueta: "Suscripción" },
  { id: "privacidad", href: "/panel/privacidad", etiqueta: "Privacidad" },
] as const;

type SeccionPanel = (typeof ENLACES)[number]["id"];

/**
 * Navegación entre las secciones del panel del club.
 *
 * Dos de ellas llevan contador en rojo, y por el mismo motivo: sin él,
 * la única forma de enterarse era entrar a mirar por si acaso.
 *
 *   - "Solicitudes": empresas que han escrito y siguen sin abrir. Una
 *     empresa interesada podía estar esperando semanas.
 *   - "Tareas": compromisos con un patrocinador cuya fecha ya pasó. Es
 *     lo que hace que el patrocinio se cumpla en vez de quedarse en la
 *     cabeza del que lo firmó.
 */
export async function PanelNav({ activo }: { activo: SeccionPanel }) {
  const [sinAbrir, vencidas] = await Promise.all([
    contarSolicitudesNuevas(),
    contarTareasVencidas(),
  ]);

  const contadorDe = (id: SeccionPanel): number =>
    id === "solicitudes" ? sinAbrir : id === "tareas" ? vencidas : 0;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
      {ENLACES.map((enlace) => {
        const contador = contadorDe(enlace.id);

        return (
          <Link
            key={enlace.id}
            href={enlace.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activo === enlace.id ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {enlace.etiqueta}
            {contador > 0 && (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activo === enlace.id ? "bg-white text-teal-700" : "bg-red-600 text-white"
                }`}
                aria-label={
                  enlace.id === "solicitudes" ? `${contador} sin abrir` : `${contador} vencidas`
                }
              >
                {contador}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
