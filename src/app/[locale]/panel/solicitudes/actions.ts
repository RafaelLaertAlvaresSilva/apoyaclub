"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { enviarEmailRespuestaDelClub } from "@/lib/email/resend";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ContactRequestStatus, Role } from "@/lib/types";

const RUTA_SOLICITUDES = "/panel/solicitudes";

const ESTADOS_VALIDOS: ContactRequestStatus[] = [
  "new",
  "seen",
  "in_conversation",
  "closed",
  "discarded",
];

/**
 * Igual que `obtenerClubActual` de `app/panel/actions.ts` y
 * `app/panel/oportunidades/actions.ts`: recupera el cliente de Supabase
 * y el usuario autenticado, comprobando que tiene rol "club".
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

/** Cambia el estado de una solicitud de contacto recibida (un clic, igual que `cambiarEstadoOportunidad`). */
export async function cambiarEstadoSolicitud(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(ESTADOS_VALIDOS as string[]).includes(status)) return;

  // Se lee el estado anterior para no volver a avisar a la empresa si el
  // club pulsa dos veces el mismo botón.
  const { data: anterior } = await supabase
    .from("contact_requests")
    .select("status, company_id, opportunity_id")
    .eq("id", id)
    .eq("club_id", user.id)
    .maybeSingle<{ status: ContactRequestStatus; company_id: string; opportunity_id: string | null }>();

  if (!anterior) return;

  await supabase
    .from("contact_requests")
    .update({ status: status as ContactRequestStatus })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_SOLICITUDES);

  const nuevoEstado = status as ContactRequestStatus;
  const hayNovedadParaLaEmpresa =
    nuevoEstado !== anterior.status &&
    (nuevoEstado === "in_conversation" || nuevoEstado === "discarded");

  if (hayNovedadParaLaEmpresa) {
    await avisarEmpresaPorEmail({
      companyId: anterior.company_id,
      clubId: user.id,
      opportunityId: anterior.opportunity_id,
      aceptada: nuevoEstado === "in_conversation",
    });
  }
}

/**
 * Aviso a la empresa de que el club ha movido su solicitud: abierta la
 * conversación o descartada. Sin esto, la empresa se quedaba esperando
 * una respuesta que solo existía dentro del panel del club.
 *
 * Es un extra: si falla, el cambio de estado ya está guardado.
 */
async function avisarEmpresaPorEmail({
  companyId,
  clubId,
  opportunityId,
  aceptada,
}: {
  companyId: string;
  clubId: string;
  opportunityId: string | null;
  aceptada: boolean;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    const [empresa, { data: club }] = await Promise.all([
      admin.auth.admin.getUserById(companyId),
      admin.from("clubs").select("name, slug").eq("id", clubId).maybeSingle<{ name: string; slug: string }>(),
    ]);

    const companyEmail = empresa.data.user?.email;
    if (!companyEmail || !club) return;

    let opportunityTitle: string | null = null;
    if (opportunityId) {
      const { data } = await admin
        .from("opportunities")
        .select("title")
        .eq("id", opportunityId)
        .maybeSingle<{ title: string }>();
      opportunityTitle = data?.title ?? null;
    }

    await enviarEmailRespuestaDelClub({
      companyEmail,
      clubName: club.name,
      clubUrl: `${SITE_URL}/${routing.defaultLocale}/club/${club.slug}`,
      buscarUrl: `${SITE_URL}/${routing.defaultLocale}/buscar`,
      opportunityTitle,
      aceptada,
    });
  } catch (excepcion) {
    console.error("[contact-requests] No se ha podido avisar a la empresa:", excepcion);
  }
}
