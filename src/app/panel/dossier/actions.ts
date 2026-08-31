"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { seccionesValidas, type DossierRow } from "@/lib/dossier-mappers";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoDossier =
  | { error: string; ok?: false }
  | { ok: true; error?: undefined; shareUrl: string | null }
  | null;

const RUTA_DOSSIER = "/panel/dossier";

/**
 * Igual que `obtenerClubActual` de `app/panel/actions.ts`: recupera el
 * cliente de Supabase y el usuario autenticado, comprobando que tiene
 * rol "club". El middleware ya protege `/panel`, pero cada Server
 * Action se valida a sí misma por si se invocara desde otro sitio.
 */
async function obtenerClubActual(): Promise<
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
  if (rol !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  return { supabase, user };
}

/** Token aleatorio para el enlace público del dossier (no adivinable). */
function generarTokenEnlace(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Guarda qué secciones y qué oportunidades incluye el dossier del club,
 * y gestiona su enlace público opcional (Fase 9): al activarlo desde
 * "desactivado" se genera un token nuevo, para que un enlace ya
 * desactivado no pueda volver a funcionar por sorpresa.
 */
export async function guardarConfiguracionDossier(
  _estadoPrevio: EstadoDossier,
  formData: FormData,
): Promise<EstadoDossier> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const secciones = seccionesValidas(formData.getAll("sections"));

  const idsOportunidadesSolicitados = formData.getAll("opportunityIds").map(String);
  let opportunityIds: string[] = [];
  if (idsOportunidadesSolicitados.length > 0) {
    // Solo se guardan las que de verdad son del club (evita que se cuele
    // el id de una oportunidad ajena manipulando el formulario).
    const { data: propias } = await supabase
      .from("opportunities")
      .select("id")
      .eq("club_id", user.id)
      .in("id", idsOportunidadesSolicitados);
    opportunityIds = (propias ?? []).map((fila) => fila.id as string);
  }

  const shareEnabledSolicitado = formData.get("shareEnabled") != null;

  const fechaCaducidad = String(formData.get("shareExpiresAt") ?? "").trim();
  let shareExpiresAt: string | null = null;
  if (fechaCaducidad) {
    const fecha = new Date(`${fechaCaducidad}T23:59:59`);
    if (Number.isNaN(fecha.getTime())) {
      return { error: "La fecha de caducidad no es válida." };
    }
    shareExpiresAt = fecha.toISOString();
  }

  const { data: actual } = await supabase
    .from("club_dossiers")
    .select("share_token, share_enabled")
    .eq("id", user.id)
    .maybeSingle<Pick<DossierRow, "share_token" | "share_enabled">>();

  // Se genera un token nuevo si se activa el enlace y antes no lo estaba
  // (o todavía no existía ninguno); si ya estaba activo, se conserva.
  const shareToken =
    shareEnabledSolicitado && (!actual?.share_enabled || !actual?.share_token)
      ? generarTokenEnlace()
      : (actual?.share_token ?? null);

  const { error } = await supabase.from("club_dossiers").upsert({
    id: user.id,
    sections: secciones,
    opportunity_ids: opportunityIds,
    share_enabled: shareEnabledSolicitado,
    share_token: shareToken,
    share_expires_at: shareExpiresAt,
  });

  if (error) return { error: "No se ha podido guardar la configuración del dossier." };

  revalidatePath(RUTA_DOSSIER);

  return {
    ok: true,
    shareUrl: shareEnabledSolicitado && shareToken ? `${SITE_URL}/dossier/${shareToken}` : null,
  };
}
