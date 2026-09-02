/**
 * Campo trampa de los formularios públicos (Fase 15).
 *
 * Vive en su propio archivo, sin ninguna dependencia de servidor, porque
 * lo usan a la vez el componente de cliente que pinta el campo
 * (`components/CampoTrampa.tsx`) y las Server Actions que lo comprueban
 * (`lib/rate-limit.ts`). Si esta constante viviera junto al limitador,
 * el bundle del navegador arrastraría `next/headers` y el cliente de
 * Supabase con la clave de servicio: Next.js corta el build por eso, y
 * hace bien.
 *
 * El nombre (`website_url`) es lo bastante corriente como para que los
 * rellenadores automáticos piquen; una persona no lo ve nunca.
 */
export const CAMPO_TRAMPA = "website_url";

export function pareceBot(formData: FormData): boolean {
  return String(formData.get(CAMPO_TRAMPA) ?? "").trim().length > 0;
}
