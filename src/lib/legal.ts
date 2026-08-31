/**
 * Versiones de los textos legales (Fase 11). Cada vez que se revise o
 * cambie el contenido de una página legal, se sube su fecha aquí: así
 * `consent_records` guarda qué redacción concreta aceptó cada usuario,
 * no solo que aceptó "algo" en algún momento, y cada página muestra su
 * fecha de "última actualización" real.
 *
 * PENDIENTE DE REVISIÓN JURÍDICA: fecha real de la primera versión
 * revisada por un abogado. De momento son solo plantillas.
 */
export const LEGAL_VERSIONS = {
  legalNotice: "2026-08-31",
  privacy: "2026-08-31",
  cookies: "2026-08-31",
  terms: "2026-08-31",
  minorsPhotoUpload: "2026-08-31",
} as const;

/** Tipos de consentimiento que se registran en `consent_records`. */
export const CONSENT_TYPES = {
  /** Aceptación conjunta de Condiciones de Uso + Política de Privacidad al registrarse. */
  termsAndPrivacy: "terms_and_privacy",
  minorsPhotoUpload: "minors_photo_upload",
} as const;

export type ConsentType = (typeof CONSENT_TYPES)[keyof typeof CONSENT_TYPES];

/** Fecha de una versión legal en formato largo en español (ej. "31 de agosto de 2026"). */
export function formatearFechaLegal(fechaIso: string): string {
  return new Date(`${fechaIso}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
