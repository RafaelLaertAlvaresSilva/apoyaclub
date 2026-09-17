"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import { hoyISO, prepararLineas } from "@/lib/tareas-patrocinio";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_TAREAS = "/panel/tareas";

async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }

  return { supabase, user };
}

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

/** Una fecha del formulario, solo si tiene la forma AAAA-MM-DD. */
function leerFecha(formData: FormData, campo: string): string | null {
  const valor = leerTexto(formData, campo);
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
}

/**
 * Un fallo de base de datos con su motivo apuntado. Mismo criterio que
 * en el resto del panel: al club se le dice algo que pueda entender,
 * pero el motivo técnico no se pierde.
 */
function fallo(operacion: string, error: unknown, mensaje: string): EstadoGuardado {
  avisarDeFallo("tareas", `No se ha podido ${operacion}`, error);
  return { error: mensaje };
}

/** El patrocinador, solo si es de este club. Si no, null. */
async function comprobarPatrocinador(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  patrocinadorId: string | null,
): Promise<string | null> {
  if (!patrocinadorId) return null;

  const { data } = await supabase
    .from("club_sponsors")
    .select("id")
    .eq("id", patrocinadorId)
    .eq("club_id", clubId)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

/**
 * Da de alta una o varias tareas para la misma empresa.
 *
 * Varias de una vez porque así es como se cierra un patrocinio: no se
 * promete "una publicación", se promete un paquete —dos publicaciones,
 * un vídeo y una visita— y obligar a rellenar el formulario cuatro
 * veces seguidas escribiendo el mismo nombre de empresa es la forma
 * más rápida de que el club deje de apuntar nada.
 */
export async function crearTareas(_previo: EstadoGuardado, formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const empresa = leerTexto(formData, "empresa");
  if (!empresa) return { error: "Escribe para qué empresa es." };

  const textos = (campo: string) => formData.getAll(campo).map((valor) => String(valor));
  const leidas = prepararLineas({
    acciones: textos("accion"),
    inicios: textos("inicio"),
    fines: textos("fin"),
    notas: textos("notas"),
  });

  if ("error" in leidas) return { error: leidas.error };

  // El identificador del patrocinador lo pone el desplegable cuando se
  // elige uno de la ficha del club. Se comprueba que sea suyo antes de
  // guardarlo: llega del navegador, así que no vale fiarse de que sea
  // el que mandamos nosotros. Si no cuadra, la tarea se guarda igual
  // con el nombre escrito — perder el enlace es mucho mejor que perder
  // lo que el club acaba de apuntar.
  const patrocinadorId = await comprobarPatrocinador(
    sesion.supabase,
    sesion.user.id,
    leerTexto(formData, "patrocinadorId"),
  );

  const filas = leidas.lineas.map((linea) => ({
    club_id: sesion.user.id,
    company_name: empresa.slice(0, 120),
    action: linea.accion,
    notes: linea.notas,
    starts_on: linea.inicio,
    due_on: linea.fin,
    sponsor_id: patrocinadorId,
    status: "pendiente",
  }));

  // Un solo insert con todas: o entran todas o no entra ninguna. Media
  // lista guardada sería peor que nada, porque el club no sabría cuál
  // falta.
  const { error } = await sesion.supabase.from("club_sponsor_tasks").insert(filas);

  if (error) return fallo("crear las tareas", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_TAREAS);
  revalidatePath("/panel");
  return { ok: true };
}

export async function editarTarea(_previo: EstadoGuardado, formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  const empresa = leerTexto(formData, "empresa");
  const accion = leerTexto(formData, "accion");
  const fin = leerFecha(formData, "fin");
  const inicio = leerFecha(formData, "inicio");

  if (!id) return { error: "No se ha encontrado la tarea." };
  if (!empresa) return { error: "Escribe para qué empresa es." };
  if (!accion) return { error: "Escribe qué hay que hacer." };
  if (!fin) return { error: "Pon la fecha límite." };
  if (inicio && inicio > fin) {
    return { error: "La fecha de inicio no puede ser posterior a la fecha límite." };
  }

  const { error } = await sesion.supabase
    .from("club_sponsor_tasks")
    .update({
      company_name: empresa.slice(0, 120),
      action: accion.slice(0, 200),
      notes: leerTexto(formData, "notas")?.slice(0, 1000) ?? null,
      starts_on: inicio,
      due_on: fin,
    })
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  if (error) return fallo("editar la tarea", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_TAREAS);
  revalidatePath("/panel");
  return { ok: true };
}

/**
 * Marca una tarea como hecha, pendiente o cancelada.
 *
 * `done_at` se pone y se quita aquí, nunca desde el formulario: la
 * base de datos exige que una tarea hecha tenga fecha y que una que no
 * lo está no la tenga (migración 0030), y esa coherencia es más fácil
 * de garantizar en un solo sitio.
 */
export async function cambiarEstadoTarea(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  const estado = leerTexto(formData, "estado");

  if (!id) return { error: "No se ha encontrado la tarea." };
  if (estado !== "pendiente" && estado !== "hecho" && estado !== "cancelado") {
    return { error: "Estado no válido." };
  }

  const prueba = leerTexto(formData, "pruebaUrl");

  const { error } = await sesion.supabase
    .from("club_sponsor_tasks")
    .update({
      status: estado,
      done_at: estado === "hecho" ? new Date().toISOString() : null,
      // El enlace de la prueba solo se toca si viene en el formulario:
      // volver a marcar pendiente no tiene por qué borrar el enlace que
      // el club ya había pegado.
      ...(prueba !== null ? { proof_url: prueba.slice(0, 500) } : {}),
    })
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  if (error) {
    return fallo("cambiar el estado de la tarea", error, "No se ha podido guardar. Inténtalo de nuevo.");
  }

  revalidatePath(RUTA_TAREAS);
  revalidatePath("/panel");
  return { ok: true };
}

export async function borrarTarea(_previo: EstadoGuardado, formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha encontrado la tarea." };

  const { error } = await sesion.supabase
    .from("club_sponsor_tasks")
    .delete()
    .eq("id", id)
    .eq("club_id", sesion.user.id);

  if (error) return fallo("borrar la tarea", error, "No se ha podido borrar. Inténtalo de nuevo.");

  revalidatePath(RUTA_TAREAS);
  revalidatePath("/panel");
  return { ok: true };
}

/**
 * Duplica una tarea con la fecha corrida un mes. Las acciones de
 * patrocinio se repiten ("una publicación al mes durante la
 * temporada") y volver a escribirlas doce veces es la forma más rápida
 * de que el club deje de usar esto.
 */
export async function repetirTarea(_previo: EstadoGuardado, formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerClubActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha encontrado la tarea." };

  const { data: original, error: errorLectura } = await sesion.supabase
    .from("club_sponsor_tasks")
    .select("company_name, sponsor_id, action, notes, starts_on, due_on")
    .eq("id", id)
    .eq("club_id", sesion.user.id)
    .maybeSingle<{
      company_name: string;
      sponsor_id: string | null;
      action: string;
      notes: string | null;
      starts_on: string | null;
      due_on: string;
    }>();

  if (errorLectura || !original) {
    return fallo("repetir la tarea", errorLectura, "No se ha podido repetir. Inténtalo de nuevo.");
  }

  const unMesDespues = (fecha: string | null): string | null => {
    if (!fecha) return null;
    const [anio, mes, dia] = fecha.split("-").map(Number);
    return hoyISO(new Date(anio, mes, dia));
  };

  const { error } = await sesion.supabase.from("club_sponsor_tasks").insert({
    club_id: sesion.user.id,
    company_name: original.company_name,
    sponsor_id: original.sponsor_id,
    action: original.action,
    notes: original.notes,
    starts_on: unMesDespues(original.starts_on),
    due_on: unMesDespues(original.due_on) ?? original.due_on,
    status: "pendiente",
  });

  if (error) return fallo("repetir la tarea", error, "No se ha podido repetir. Inténtalo de nuevo.");

  revalidatePath(RUTA_TAREAS);
  revalidatePath("/panel");
  return { ok: true };
}
