"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA = "/panel/renovaciones";

/** Una fecha del formulario, solo si tiene la forma AAAA-MM-DD. */
function leerFecha(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
}

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor.slice(0, 2000);
}

/**
 * Guardar las fechas de renovación de un patrocinador.
 *
 * El `club_id` se saca de la sesión y nunca del formulario, y además se
 * usa en el `where`: sin eso, cualquiera podría mandar el id de un
 * patrocinador ajeno y escribir en la ficha de otro club.
 */
export async function guardarRenovacion(
  _estado: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const t = await getTranslations("panel.acciones");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: t("tuSesionCaducadoVuelveIniciar") };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: t("estaAccionSoloEstaDisponible") };
  }

  const patrocinadorId = String(formData.get("patrocinadorId") ?? "");
  if (!patrocinadorId) return { error: t("sabemosPatrocinadorTrata") };

  const renewalDate = leerFecha(formData, "renewalDate");
  const agreementEndsOn = leerFecha(formData, "agreementEndsOn");

  // La misma comprobación que hace la base de datos, aquí: así el club
  // lee un motivo en vez de un error de restricción.
  if (renewalDate && agreementEndsOn && renewalDate > agreementEndsOn) {
    return {
      error: t("fechaParaEscribirTieneSer"),
    };
  }

  const { error } = await supabase
    .from("club_sponsors")
    .update({
      renewal_date: renewalDate,
      agreement_ends_on: agreementEndsOn,
      renewal_notes: leerTexto(formData, "renewalNotes"),
    })
    .eq("id", patrocinadorId)
    .eq("club_id", user.id);

  if (error) {
    avisarDeFallo("tareas", "No se pudo guardar la renovación", { error, patrocinadorId });
    // La migración 0050 puede no estar aplicada todavía: ahí la columna
    // no existe y el mensaje de Postgres no le dice nada a un club.
    return {
      error: error.message.includes("column")
        ? t("faltaMigracion")
        : t("noGuardadosCambios"),
    };
  }

  revalidatePath(RUTA);
  revalidatePath("/panel");
  return { ok: true };
}
