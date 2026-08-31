import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsentType } from "@/lib/legal";

/**
 * Registra un consentimiento con fecha en `consent_records` (Fase 11).
 * Sirve tanto con el cliente normal (el propio usuario, protegido por
 * RLS) como con el cliente admin (justo al registrarse, cuando todavía
 * no hay sesión activa porque falta confirmar el email).
 *
 * No lanza si falla: es un registro de auditoría, no debe impedir que
 * el usuario complete la acción principal (crear la cuenta, subir la
 * foto). El fallo queda en los logs del servidor.
 */
export async function registrarConsentimiento(
  supabase: SupabaseClient,
  userId: string,
  tipo: ConsentType,
  version: string,
): Promise<void> {
  const { error } = await supabase.from("consent_records").insert({
    user_id: userId,
    consent_type: tipo,
    version,
  });

  if (error) {
    console.error("[consentimiento] No se ha podido registrar:", tipo, error);
  }
}
