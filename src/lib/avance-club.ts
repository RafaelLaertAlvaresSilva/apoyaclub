/**
 * El avance de un club en sus primeros pasos, para que el administrador
 * vea de un vistazo quién se ha atascado y le pueda escribir a tiempo
 * (pedido por Rafael el 6-11-2026). Va en Administración → Clubes.
 *
 * Los pasos, en el orden en que un club tiene que darlos:
 *   1. confirmar el correo (sin eso no puede entrar en su panel);
 *   2. completar la ficha (al menos el 60 %: con menos, a una empresa
 *      no le dice nada);
 *   3. publicar al menos una oportunidad;
 *   4. preparar el dossier (guardarlo en su panel).
 *
 * El primero que falta es el "siguiente paso": lo que hay que decirle
 * al club cuando le escribes.
 */
export type AvanceClub = {
  correoConfirmado: boolean;
  /** 0-100. */
  ficha: number;
  /** Oportunidades y necesidades publicadas (disponibles, sin archivar). */
  oportunidades: number;
  /** De ellas, cuántas salieron de "Generar mis oportunidades". */
  generadas: number;
  /** Si ha guardado su dossier en el panel. */
  dossier: boolean;
  /** Si ha activado el enlace público del dossier para mandarlo. */
  enlaceDossier: boolean;
  ultimoAcceso: string | null;
};

export const PASOS_DEL_CLUB = ["correo", "ficha", "oportunidades", "dossier"] as const;
export type PasoDelClub = (typeof PASOS_DEL_CLUB)[number];

/** Con cuánto se da la ficha por buena. */
export const FICHA_SUFICIENTE = 60;

export function pasoHecho(avance: AvanceClub, paso: PasoDelClub): boolean {
  switch (paso) {
    case "correo":
      return avance.correoConfirmado;
    case "ficha":
      return avance.ficha >= FICHA_SUFICIENTE;
    case "oportunidades":
      return avance.oportunidades > 0;
    case "dossier":
      return avance.dossier;
  }
}

/** El primer paso que le falta, o null si los tiene todos. */
export function siguientePaso(avance: AvanceClub): PasoDelClub | null {
  return PASOS_DEL_CLUB.find((paso) => !pasoHecho(avance, paso)) ?? null;
}

/** Días desde que entró por última vez (null si nunca ha entrado). */
export function diasSinEntrar(ultimoAcceso: string | null, ahora: Date = new Date()): number | null {
  if (!ultimoAcceso) return null;
  return Math.max(0, Math.floor((ahora.getTime() - new Date(ultimoAcceso).getTime()) / 86_400_000));
}

/** Si conviene escribirle: le falta algo y lleva una semana sin entrar (o no ha entrado nunca). */
export function convieneEscribirle(avance: AvanceClub, ahora: Date = new Date()): boolean {
  if (siguientePaso(avance) === null) return false;
  const dias = diasSinEntrar(avance.ultimoAcceso, ahora);
  return dias === null || dias >= 7;
}
