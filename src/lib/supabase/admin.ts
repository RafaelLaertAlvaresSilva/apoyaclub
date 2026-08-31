import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave de rol de servicio (service role).
 *
 * SOLO debe usarse en código de servidor (Server Actions, Route Handlers),
 * nunca en un Client Component ni en código que se envíe al navegador.
 * Se usa para lo que necesita saltarse la RLS: asignar el rol
 * (club/empresa) del usuario en `app_metadata` (un dato que el propio
 * usuario no puede modificar), leer su email de contacto sin sesión
 * (página pública del club) y servir el enlace público del dossier
 * (Fase 9, `club_dossiers` no tiene ninguna política de lectura pública).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan las variables de entorno de Supabase (URL o clave de servicio).",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
