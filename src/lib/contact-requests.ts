import type { ContactRequestStatus } from "@/lib/types";

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
