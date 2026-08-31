/**
 * URL pública del sitio (sin barra final). Se usa para construir URLs
 * absolutas: metadatos de Open Graph, JSON-LD, el enlace que se copia
 * al compartir la página de un club (Fase 5), etc.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
