"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  BudgetPeriod,
  CollaborationType,
  ObjectiveTag,
  OpportunityStatus,
  OpportunityType,
  Role,
  SponsorLevel,
} from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_OPORTUNIDADES = "/panel/oportunidades";

const TIPOS_VALIDOS: OpportunityType[] = [
  "equipment",
  "venue_matches",
  "social_content",
  "events_tournaments",
  "youth",
  "in_kind",
];

const ESTADOS_VALIDOS: OpportunityStatus[] = ["available", "reserved", "closed"];

// Fase 7: campos nuevos, todos opcionales.
const FORMAS_VALIDAS: CollaborationType[] = ["money", "product", "service", "mixed"];
const PERIODOS_VALIDOS: BudgetPeriod[] = ["match", "month", "season", "event"];
const OBJETIVOS_VALIDOS: ObjectiveTag[] = [
  "familias",
  "jovenes",
  "comunidad_local",
  "deporte_femenino",
  "deporte_base",
  "visibilidad",
  "contenido",
  "clientes",
  "empleados",
  "rsc",
];

const NIVELES_VALIDOS: SponsorLevel[] = ["principal", "oficial", "colaborador", "libre"];

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

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function leerValor(formData: FormData): number | null {
  const valor = String(formData.get("value") ?? "").trim();
  if (valor === "") return null;
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function leerTipo(formData: FormData): OpportunityType | null {
  const valor = String(formData.get("opportunityType") ?? "");
  return (TIPOS_VALIDOS as string[]).includes(valor) ? (valor as OpportunityType) : null;
}

function leerEstado(formData: FormData): OpportunityStatus | null {
  const valor = String(formData.get("status") ?? "");
  return (ESTADOS_VALIDOS as string[]).includes(valor) ? (valor as OpportunityStatus) : null;
}

// Fase 7: forma de colaboración y periodo son opcionales ("Sin
// especificar" en el formulario se envía como cadena vacía). Objetivo es
// una casilla múltiple: puede haber cero, una o varias marcadas.
function leerFormaColaboracion(formData: FormData): CollaborationType | null {
  const valor = String(formData.get("collaborationType") ?? "");
  return (FORMAS_VALIDAS as string[]).includes(valor) ? (valor as CollaborationType) : null;
}

function leerPeriodo(formData: FormData): BudgetPeriod | null {
  const valor = String(formData.get("period") ?? "");
  return (PERIODOS_VALIDOS as string[]).includes(valor) ? (valor as BudgetPeriod) : null;
}

function leerNivelPatrocinio(formData: FormData): SponsorLevel {
  const valor = String(formData.get("sponsorLevel") ?? "");
  return (NIVELES_VALIDOS as string[]).includes(valor) ? (valor as SponsorLevel) : "libre";
}

/**
 * El equipo asociado tiene que ser un equipo del propio club: si no, se
 * guarda como null. Se comprueba contra la base de datos porque el valor
 * llega de un formulario y un `select` se puede manipular.
 */
async function leerEquipo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  formData: FormData,
): Promise<string | null> {
  const valor = String(formData.get("teamId") ?? "").trim();
  if (!valor) return null;

  const { data } = await supabase
    .from("club_teams")
    .select("id")
    .eq("id", valor)
    .eq("club_id", clubId)
    .maybeSingle();

  return data ? valor : null;
}

function leerObjetivos(formData: FormData): ObjectiveTag[] {
  return formData
    .getAll("objectives")
    .map((valor) => String(valor))
    .filter((valor): valor is ObjectiveTag => (OBJETIVOS_VALIDOS as string[]).includes(valor));
}

// ---------------------------------------------------------------------
// Crear
// ---------------------------------------------------------------------
export async function crearOportunidad(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const title = leerTexto(formData, "title");
  if (!title) return { error: "Indica el nombre de la oportunidad." };

  const opportunityType = leerTipo(formData);
  if (!opportunityType) return { error: "Elige un tipo de oportunidad." };

  const value = leerValor(formData);
  if (value === null) return { error: "Indica un valor válido (0 o más)." };

  const { error } = await supabase.from("opportunities").insert({
    club_id: user.id,
    title,
    description: leerTexto(formData, "description"),
    opportunity_type: opportunityType,
    value,
    duration: leerTexto(formData, "duration"),
    period: leerPeriodo(formData),
    collaboration_type: leerFormaColaboracion(formData),
    objectives: leerObjetivos(formData),
    sponsor_level: leerNivelPatrocinio(formData),
    exclusivity: leerTexto(formData, "exclusivity"),
    team_id: await leerEquipo(supabase, user.id, formData),
  });

  if (error) return { error: "No se ha podido crear la oportunidad." };

  revalidatePath(RUTA_OPORTUNIDADES);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Editar
// ---------------------------------------------------------------------
export async function actualizarOportunidad(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Oportunidad no encontrada." };

  const title = leerTexto(formData, "title");
  if (!title) return { error: "Indica el nombre de la oportunidad." };

  const opportunityType = leerTipo(formData);
  if (!opportunityType) return { error: "Elige un tipo de oportunidad." };

  const value = leerValor(formData);
  if (value === null) return { error: "Indica un valor válido (0 o más)." };

  const status = leerEstado(formData) ?? "available";

  const { error } = await supabase
    .from("opportunities")
    .update({
      title,
      description: leerTexto(formData, "description"),
      opportunity_type: opportunityType,
      value,
      duration: leerTexto(formData, "duration"),
      period: leerPeriodo(formData),
      collaboration_type: leerFormaColaboracion(formData),
      objectives: leerObjetivos(formData),
      sponsor_level: leerNivelPatrocinio(formData),
      exclusivity: leerTexto(formData, "exclusivity"),
      team_id: await leerEquipo(supabase, user.id, formData),
      status,
    })
    .eq("id", id)
    .eq("club_id", user.id);

  if (error) return { error: "No se ha podido guardar la oportunidad." };

  revalidatePath(RUTA_OPORTUNIDADES);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Cambiar estado (un clic): disponible / reservada / cerrada
// ---------------------------------------------------------------------
export async function cambiarEstadoOportunidad(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const status = leerEstado(formData);
  if (!id || !status) return;

  await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_OPORTUNIDADES);
}

// ---------------------------------------------------------------------
// Duplicar
// ---------------------------------------------------------------------
export async function duplicarOportunidad(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: original } = await supabase
    .from("opportunities")
    .select(
      "title, description, opportunity_type, value, duration, period, collaboration_type, objectives, sponsor_level, exclusivity, team_id",
    )
    .eq("id", id)
    .eq("club_id", user.id)
    .maybeSingle();

  if (!original) return;

  await supabase.from("opportunities").insert({
    club_id: user.id,
    title: `${original.title} (copia)`,
    description: original.description,
    opportunity_type: original.opportunity_type,
    value: original.value,
    duration: original.duration,
    period: original.period,
    collaboration_type: original.collaboration_type,
    objectives: original.objectives,
    sponsor_level: original.sponsor_level,
    exclusivity: original.exclusivity,
    team_id: original.team_id,
  });

  revalidatePath(RUTA_OPORTUNIDADES);
}

// ---------------------------------------------------------------------
// Archivar / restaurar
// ---------------------------------------------------------------------
export async function archivarOportunidad(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("opportunities")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_OPORTUNIDADES);
}

export async function restaurarOportunidad(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("opportunities")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_OPORTUNIDADES);
}

// ---------------------------------------------------------------------
// Eliminar
// ---------------------------------------------------------------------
export async function eliminarOportunidad(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("opportunities").delete().eq("id", id).eq("club_id", user.id);
  revalidatePath(RUTA_OPORTUNIDADES);
}

// ---------------------------------------------------------------------
// Compartir como plantilla (migración 0015)
// ---------------------------------------------------------------------
/**
 * Publica el título y la descripción de una oportunidad como plantilla
 * para el resto de clubes. No comparte el valor ni la exclusividad: lo
 * que sirve a otro club es la idea, no el precio que tú le has puesto.
 *
 * Si ya la había compartido, el índice único de la tabla lo ignora en
 * vez de duplicarla.
 */
export async function compartirComoPlantilla(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: oportunidad } = await supabase
    .from("opportunities")
    .select("title, description, opportunity_type")
    .eq("id", id)
    .eq("club_id", user.id)
    .maybeSingle<{ title: string; description: string | null; opportunity_type: OpportunityType }>();

  if (!oportunidad) return;

  await supabase.from("opportunity_templates").insert({
    opportunity_type: oportunidad.opportunity_type,
    title: oportunidad.title,
    description: oportunidad.description,
    created_by: user.id,
    is_public: true,
  });

  revalidatePath(RUTA_OPORTUNIDADES);
}
