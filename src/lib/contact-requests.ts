import { createClient } from "@/lib/supabase/server";
import type { ContactRequestStatus, Role } from "@/lib/types";

/**
 * Constantes compartidas por el panel del club, donde se gestionan las
 * solicitudes de contacto recibidas (Fase 8). Mismo patrón que
 * `lib/opportunities.ts`.
 */
export const ESTADOS_SOLICITUD: { id: ContactRequestStatus; etiqueta: string }[] = [
  { id: "new", etiqueta: "Nueva" },
  { id: "seen", etiqueta: "Vista" },
  { id: "in_conversation", etiqueta: "En conversación" },
  { id: "closed", etiqueta: "Cerrada" },
  { id: "discarded", etiqueta: "Descartada" },
];

export const ETIQUETA_ESTADO_SOLICITUD: Record<ContactRequestStatus, string> = ESTADOS_SOLICITUD.reduce(
  (acumulado, estado) => ({ ...acumulado, [estado.id]: estado.etiqueta }),
  {} as Record<ContactRequestStatus, string>,
);

/**
 * Cuántas solicitudes tiene el club sin abrir todavía.
 *
 * Alimenta el contador rojo del menú del panel. Sin él, la única forma
 * de enterarse de que una empresa ha escrito era entrar a mirar por si
 * acaso, y una empresa interesada podía quedarse semanas esperando.
 *
 * Devuelve 0 ante cualquier problema: es un adorno del menú y no puede
 * tumbar todas las páginas del panel, que es donde se pinta.
 */
export async function contarSolicitudesNuevas(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role as Role | undefined) !== "club") return 0;

    const { count } = await supabase
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("club_id", user.id)
      .eq("status", "new");

    return count ?? 0;
  } catch {
    return 0;
  }
}
