import { contarSolicitudesNuevas } from "@/lib/contact-requests";
import { contarRenovacionesQueAvisanDelClub } from "@/lib/renovaciones-datos";
import { contarTareasVencidas } from "@/lib/tareas-datos";
import { MenuDelPanel } from "./MenuDelPanel";

/**
 * Navegación entre las secciones del panel del club.
 *
 * Esta mitad solo va a buscar los dos números que hay que pedirle a la
 * base de datos; el menú en sí lo pinta `MenuDelPanel`, que necesita
 * ser de cliente para abrirse y cerrarse en el móvil.
 *
 * Dos secciones llevan contador en rojo, y por el mismo motivo: sin él,
 * la única forma de enterarse era entrar a mirar por si acaso.
 *
 *   - "Solicitudes": empresas que han escrito y siguen sin abrir. Una
 *     empresa interesada podía estar esperando semanas.
 *   - "Tareas": compromisos con un patrocinador cuya fecha ya pasó. Es
 *     lo que hace que el patrocinio se cumpla en vez de quedarse en la
 *     cabeza del que lo firmó.
 */
export async function PanelNav({
  paginaPublica,
  perfilCreado,
}: {
  paginaPublica: string | null;
  perfilCreado: boolean;
}) {
  const [sinAbrir, vencidas, renovaciones] = await Promise.all([
    contarSolicitudesNuevas(),
    contarTareasVencidas(),
    contarRenovacionesQueAvisanDelClub(),
  ]);

  return (
    <MenuDelPanel
      sinAbrir={sinAbrir}
      vencidas={vencidas}
      renovaciones={renovaciones}
      paginaPublica={paginaPublica}
      perfilCreado={perfilCreado}
    />
  );
}
