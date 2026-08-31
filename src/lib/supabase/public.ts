import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para páginas públicas sin sesión (Fase 5: la
 * página de un club en `/club/[slug]`).
 *
 * A diferencia de `createClient()` (lib/supabase/server.ts) no lee ni
 * escribe cookies: solo necesita la clave anónima, así que la página
 * puede seguir siendo cacheable (`revalidate`) en vez de forzarse a
 * dinámica en cada visita. Nunca se usa para nada que dependa de quién
 * visita la página ni para escribir datos.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
