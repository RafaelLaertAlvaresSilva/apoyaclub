"use server";

import type { CompanyRow } from "@/lib/company-mappers";
import { enviarEmailNuevaSolicitudContacto } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoSolicitud = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

/**
 * Crea una solicitud de contacto de una empresa a un club (Fase 8),
 * opcionalmente sobre una oportunidad concreta, y avisa al club por
 * email (si Resend no está configurado, la solicitud se crea igual: ver
 * `lib/email/resend.ts`).
 *
 * La plataforma solo pone en contacto a las dos partes: no hay chat
 * interno, ni gestión de contratos, ni cobros entre club y empresa.
 */
export async function crearSolicitudContacto(
  _estadoPrevio: EstadoSolicitud,
  formData: FormData,
): Promise<EstadoSolicitud> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "empresa") {
    return { error: "Solo las empresas pueden solicitar contacto." };
  }

  const clubId = String(formData.get("clubId") ?? "");
  const opportunityId = String(formData.get("opportunityId") ?? "") || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!clubId) return { error: "Club no encontrado." };
  if (!message) return { error: "Escribe un mensaje para el club." };

  const { error } = await supabase.from("contact_requests").insert({
    company_id: user.id,
    club_id: clubId,
    opportunity_id: opportunityId,
    message,
  });

  if (error) {
    return { error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." };
  }

  // El email es un extra: si falla, la solicitud ya se ha creado y el
  // club la verá igualmente en su panel (Hecho cuando... de la Fase 8).
  await notificarClubPorEmail({ clubId, opportunityId, message, companyId: user.id });

  return { ok: true };
}

async function notificarClubPorEmail({
  clubId,
  opportunityId,
  message,
  companyId,
}: {
  clubId: string;
  opportunityId: string | null;
  message: string;
  companyId: string;
}) {
  try {
    const admin = createAdminClient();

    const [clubAuth, companyAuth, { data: clubRow }, { data: companyRow }] = await Promise.all([
      admin.auth.admin.getUserById(clubId),
      admin.auth.admin.getUserById(companyId),
      admin.from("clubs").select("name").eq("id", clubId).maybeSingle(),
      admin.from("companies").select("*").eq("id", companyId).maybeSingle<CompanyRow>(),
    ]);

    const clubEmail = clubAuth.data.user?.email;
    if (!clubEmail) return;

    let opportunityTitle: string | null = null;
    if (opportunityId) {
      const { data } = await admin
        .from("opportunities")
        .select("title")
        .eq("id", opportunityId)
        .maybeSingle();
      opportunityTitle = data?.title ?? null;
    }

    const companyName =
      companyRow?.name ||
      (companyAuth.data.user?.user_metadata?.name as string | undefined) ||
      "Una empresa";

    const presupuestoTexto =
      companyRow?.budget_min != null || companyRow?.budget_max != null
        ? [companyRow?.budget_min, companyRow?.budget_max]
            .filter((valor) => valor != null)
            .map((valor) => `${valor} €`)
            .join(" - ")
        : null;

    await enviarEmailNuevaSolicitudContacto({
      clubEmail,
      clubName: clubRow?.name ?? "tu club",
      companyName,
      companySector: companyRow?.sector ?? null,
      companyCity: companyRow?.city ?? null,
      companyWebsite: companyRow?.website ?? null,
      presupuestoTexto,
      opportunityTitle,
      message,
      panelUrl: `${SITE_URL}/panel/solicitudes`,
    });
  } catch (excepcion) {
    console.error("[contact-requests] No se ha podido notificar al club por email:", excepcion);
  }
}
