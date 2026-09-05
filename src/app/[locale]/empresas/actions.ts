"use server";

import { revalidatePath } from "next/cache";
import { avisarDeFallo } from "@/lib/monitoring";
import { consumirLimite } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoPropuesta = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

/**
 * Tope diario de propuestas por club.
 *
 * El directorio existe para que a una empresa le lleguen propuestas
 * buenas, no todas. Un club que puede escribir a cien empresas en una
 * tarde no escribe cien propuestas: escribe una y la copia cien veces,
 * y a la tercera las empresas se dan de baja. Con seis al día hay que
 * elegir a quién, que es justo lo que hace que la propuesta sea buena.
 */
const PROPUESTAS_AL_DIA = 6;

export async function enviarPropuesta(
  _estadoPrevio: EstadoPropuesta,
  formData: FormData,
): Promise<EstadoPropuesta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Inicia sesión con tu club para escribir a una empresa." };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: "Solo los clubes pueden mandar propuestas a las empresas." };
  }

  const companyId = String(formData.get("companyId") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!companyId) return { error: "No se ha encontrado la empresa." };
  if (mensaje.length < 20) {
    return { error: "Escribe algo más: cuéntale quién eres y qué le ofreces (mínimo 20 caracteres)." };
  }
  if (mensaje.length > 2000) return { error: "El mensaje es demasiado largo." };

  const dentroDelCupo = await consumirLimite({
    bucket: "propuesta-a-empresa",
    identificador: user.id,
    limite: PROPUESTAS_AL_DIA,
    ventanaSegundos: 24 * 60 * 60,
  });

  if (!dentroDelCupo) {
    return {
      error: `Has escrito a ${PROPUESTAS_AL_DIA} empresas hoy. Sigue mañana: pocas y bien pensadas funcionan mejor que muchas iguales.`,
    };
  }

  const { error } = await supabase.from("club_proposals").insert({
    club_id: user.id,
    company_id: companyId,
    message: mensaje,
  });

  if (error) {
    // 23505 = índice único: ya le escribió a esta empresa. No es un
    // fallo, es la regla de una propuesta por pareja (migración 0033).
    if (error.code === "23505") {
      return { error: "Ya le escribiste a esta empresa. Espera su respuesta antes de insistir." };
    }
    avisarDeFallo("tareas", "No se ha podido guardar la propuesta a una empresa", error);
    return { error: "No se ha podido enviar. Inténtalo de nuevo." };
  }

  if (slug) revalidatePath(`/empresas/${slug}`);
  return { ok: true };
}
