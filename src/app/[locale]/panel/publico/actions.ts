"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { avisarDeFallo } from "@/lib/monitoring";
import { etiquetaEquipo } from "@/lib/opportunities";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import { mediaParaLaFicha } from "@/lib/publico-partidos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_PUBLICO = "/panel/publico";

async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const t = await getTranslations("panel.acciones");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: t("tuSesionCaducadoVuelveIniciar") };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: t("estaAccionSoloEstaDisponible") };
  }

  return { supabase, user };
}

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function fallo(operacion: string, error: unknown, mensaje: string): EstadoGuardado {
  avisarDeFallo("publico", `No se ha podido ${operacion}`, error);
  return { error: mensaje };
}

/** Apunta un partido con la gente que hubo. */
export async function guardarPartido(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const t = await getTranslations("panel.acciones");
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const fecha = leerTexto(formData, "fecha");
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: t("ponFechaPartido") };
  }

  const rival = leerTexto(formData, "rival");
  if (!rival) return { error: t("escribeContraQuienJugo") };

  // El público se lee a mano en vez de con `Number(...)` a secas: un
  // campo vacío se convierte en 0 con Number, y "0 personas" y "no lo
  // he apuntado" no son lo mismo.
  const publicoTexto = leerTexto(formData, "publico");
  if (publicoTexto === null) return { error: t("escribeCuantaGenteHubo") };

  const publico = Number(publicoTexto.replace(/\./g, "").replace(/\s/g, ""));
  if (!Number.isInteger(publico) || publico < 0 || publico > 200000) {
    return { error: t("publicoTieneSerNumeroEntre") };
  }

  // El equipo llega como el id de uno de la ficha, o como "otro" y
  // entonces el nombre va escrito a mano (migración 0039).
  const equipoElegido = leerTexto(formData, "equipoId");
  let equipoId: string | null = null;
  let equipoTexto = leerTexto(formData, "equipo")?.slice(0, 120) ?? null;

  if (equipoElegido && equipoElegido !== "otro") {
    // Que el equipo sea suyo no se da por hecho aunque el desplegable
    // solo enseñe los suyos: el formulario lo manda el navegador y
    // cualquiera puede cambiarlo antes de enviarlo.
    const { data: equipo } = await sesion.supabase
      .from("club_teams")
      .select("id, sport, category, gender")
      .eq("id", equipoElegido)
      .eq("club_id", sesion.user.id)
      .maybeSingle<{ id: string; sport: string; category: string | null; gender: string | null }>();

    if (!equipo) return { error: t("eseEquipoTuClub") };

    equipoId = equipo.id;
    // Se guarda también el nombre: es el que tenía el equipo el día del
    // partido, y es lo que queda si algún día se borra de la ficha.
    equipoTexto = (etiquetaEquipo(equipo) ?? equipo.sport).slice(0, 120);
  }

  const { error } = await sesion.supabase.from("club_matches").insert({
    club_id: sesion.user.id,
    played_on: fecha,
    opponent: rival.slice(0, 120),
    competition: leerTexto(formData, "competicion")?.slice(0, 120) ?? null,
    team: equipoTexto,
    team_id: equipoId,
    home: String(formData.get("donde") ?? "casa") === "casa",
    attendance: publico,
    notes: leerTexto(formData, "notas")?.slice(0, 1000) ?? null,
  });

  if (error) return fallo("guardar el partido", error, t("podidoGuardarPartido"));

  revalidatePath(RUTA_PUBLICO);
  return { ok: true };
}

export async function borrarPartido(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const t = await getTranslations("panel.acciones");
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: t("sabePartidoBorrar") };

  const { error } = await sesion.supabase
    .from("club_matches")
    .delete()
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  if (error) return fallo("borrar el partido", error, t("podidoBorrarPartido"));

  revalidatePath(RUTA_PUBLICO);
  return { ok: true };
}

/**
 * Lleva la media real a la ficha del club.
 *
 * A propósito con un botón y no por detrás: `average_attendance` es un
 * dato que el club escribió él, y pisárselo cada vez que apunta un
 * partido es cambiarle la ficha sin avisar. La media se le enseña, y
 * él decide.
 */
// Sin parámetros a propósito: `useActionState` le pasa el estado
// anterior y el formulario, y aquí no se necesita ninguno de los dos.
export async function usarMediaEnLaFicha(): Promise<EstadoGuardado> {
  const t = await getTranslations("panel.acciones");
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const partidos = await obtenerPartidosDelClub(sesion.supabase, sesion.user.id);
  const media = mediaParaLaFicha(partidos);

  if (media === null) {
    return { error: t("todaviaHayPartidosApuntadosPara") };
  }

  const { error } = await sesion.supabase
    .from("clubs")
    .update({ average_attendance: media })
    .eq("id", sesion.user.id);

  if (error) return fallo("copiar la media a la ficha", error, t("podidoGuardarMediaTuFicha"));

  revalidatePath(RUTA_PUBLICO);
  revalidatePath("/panel");
  return { ok: true };
}
