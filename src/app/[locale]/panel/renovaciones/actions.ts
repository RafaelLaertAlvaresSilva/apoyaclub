"use server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  const patrocinadorId = String(formData.get("patrocinadorId") ?? "");
  if (!patrocinadorId) return { error: "No sabemos de qué patrocinador se trata." };

  const renewalDate = leerFecha(formData, "renewalDate");
  const agreementEndsOn = leerFecha(formData, "agreementEndsOn");

  // La misma comprobación que hace la base de datos, aquí: así el club
  // lee un motivo en vez de un error de restricción.
  if (renewalDate && agreementEndsOn && renewalDate > agreementEndsOn) {
    return {
      error: "La fecha para escribir tiene que ser anterior al final del acuerdo.",
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
        ? "Esta función necesita una actualización de la base de datos que todavía no está aplicada."
        : "No hemos podido guardar los cambios. Inténtalo otra vez.",
    };
  }

  revalidatePath(RUTA);
  revalidatePath("/panel");
  return { ok: true };
}
