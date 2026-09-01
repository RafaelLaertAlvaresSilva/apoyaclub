"use server";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoEliminacion = { error: string } | null;

const TEXTO_CONFIRMACION = "ELIMINAR";

/**
 * Igual que `obtenerEmpresaActual` de `app/empresa/actions.ts`: cada
 * Server Action se valida a sí misma (sesión + rol "empresa"), aunque
 * el middleware ya protege `/empresa`.
 */
async function obtenerEmpresaActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "empresa") {
    return { error: "Esta acción solo está disponible para empresas." };
  }

  return { supabase, user };
}

/**
 * Elimina de forma permanente la cuenta de la empresa (Fase 11: derecho
 * de supresión). Las empresas no tienen suscripción ni imágenes en
 * Storage, así que basta con eliminar el usuario de Auth: el perfil,
 * las listas de favoritos, los favoritos, las solicitudes de contacto
 * y el registro de consentimientos se borran solos por las claves
 * foráneas `on delete cascade` definidas en las migraciones.
 *
 * No hay vuelta atrás: no hay una fase de "papelera" ni de recuperación.
 */
export async function eliminarCuentaEmpresa(
  _estadoPrevio: EstadoEliminacion,
  formData: FormData,
): Promise<EstadoEliminacion> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const confirmacion = String(formData.get("confirmacion") ?? "").trim();
  if (confirmacion !== TEXTO_CONFIRMACION) {
    return { error: `Escribe "${TEXTO_CONFIRMACION}" (en mayúsculas) para confirmar.` };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[eliminar cuenta] No se ha podido eliminar el usuario:", error);
    return { error: "No se ha podido eliminar la cuenta. Inténtalo de nuevo o contacta con soporte." };
  }

  await supabase.auth.signOut();
  const locale = await getLocale();
  return redirect({ href: "/cuenta-eliminada", locale });
}
