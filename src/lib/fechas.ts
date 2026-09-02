/**
 * Cálculos de días entre fechas usados por los avisos por email
 * (migración 0013). Separado en su propio archivo, sin dependencias, para
 * poder probarlo: es la parte de los crons donde un error se traduce en
 * un email enviado el día que no toca.
 */

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Días que faltan hasta `fechaIso`, redondeando hacia arriba: dentro de
 * 25 horas son 2 días, dentro de 2 horas es 1 día. Devuelve un número
 * negativo si la fecha ya pasó, y null si no hay fecha.
 */
export function diasHasta(fechaIso: string | null | undefined, ahora: Date = new Date()): number | null {
  if (!fechaIso) return null;
  const objetivo = new Date(fechaIso).getTime();
  if (!Number.isFinite(objetivo)) return null;
  return Math.ceil((objetivo - ahora.getTime()) / MS_POR_DIA);
}

/** Días completos transcurridos desde `fechaIso`. Null si no hay fecha. */
export function diasDesde(fechaIso: string | null | undefined, ahora: Date = new Date()): number | null {
  if (!fechaIso) return null;
  const inicio = new Date(fechaIso).getTime();
  if (!Number.isFinite(inicio)) return null;
  return Math.floor((ahora.getTime() - inicio) / MS_POR_DIA);
}

/**
 * Qué aviso toca enviar, si es que toca alguno: el más urgente de los
 * umbrales que todavía no se haya enviado. `enviados` son los umbrales
 * de los que ya salió el email.
 *
 * Devuelve null cuando la fecha ya pasó, cuando falta más que el umbral
 * mayor, o cuando todos los avisos pertinentes ya se enviaron.
 */
export function avisoPendiente(
  diasRestantes: number | null,
  umbrales: number[],
  enviados: number[],
): number | null {
  if (diasRestantes == null || diasRestantes < 1) return null;

  for (const umbral of [...umbrales].sort((a, b) => a - b)) {
    if (diasRestantes <= umbral && !enviados.includes(umbral)) return umbral;
  }

  return null;
}
