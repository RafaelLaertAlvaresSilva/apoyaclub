"use server";

import { leerAcciones, leerBeneficios, type Accion, type Beneficio } from "@/lib/ficha-oportunidad";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { leerCategoriaNecesidad } from "@/lib/opportunities";
import { createClient } from "@/lib/supabase/server";
import type {
  BudgetPeriod,
  CategoriaNecesidad,
  CollaborationType,
  ObjectiveTag,
  OpportunityStatus,
  OpportunityType,
  Role,
  SponsorLevel,
} from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_OPORTUNIDADES = "/panel/oportunidades";

/**
 * Refresca lo que ve una empresa, además del panel.
 *
 * La ficha pública del club y sus listados se guardan en caché un
 * minuto para ir rápidos. Hasta ahora, guardar una oportunidad solo
 * refrescaba el panel: el club cambiaba algo, iba a mirar su página y
 * la veía igual que antes. Sin saber lo de la caché, la conclusión es
 * que no se ha guardado — y vuelve a guardar, y sigue igual.
 *
 * Se refrescan todas las rutas del patrón y no solo las de este club:
 * saber el slug obligaría a una consulta más en cada guardado, y con
 * el tamaño que tiene esto no compensa.
 */
function refrescarFichaPublica(): void {
  revalidatePath(RUTA_OPORTUNIDADES);
  revalidatePath("/[locale]/club/[slug]", "page");
  revalidatePath("/[locale]/club/[slug]/oportunidades", "page");
  revalidatePath("/[locale]/club/[slug]/necesidades", "page");
  revalidatePath("/[locale]/club/[slug]/oportunidad/[id]", "page");
}

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
  "deporte_masculino",
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

/**
 * La ficha detallada que viaja como JSON en un campo oculto
 * (migración 0049).
 *
 * Se vuelve a comprobar aquí aunque el formulario ya la haya filtrado:
 * lo que llega del navegador no se guarda nunca tal cual. `leerBeneficios`
 * y `leerAcciones` tiran las líneas sin texto, recortan las largas y
 * descartan lo que no tenga la forma esperada.
 */
function leerFicha(formData: FormData): { benefits: Beneficio[]; actions: Accion[] } {
  const trozo = (campo: string): unknown => {
    try {
      return JSON.parse(String(formData.get(campo) ?? "[]"));
    } catch {
      // Un JSON roto no puede tumbar el guardado entero: se pierde la
      // ficha, que se vuelve a escribir, y no la oportunidad.
      return [];
    }
  };

  return {
    benefits: leerBeneficios(trozo("beneficios")),
    actions: leerAcciones(trozo("acciones")),
  };
}

/** Una fecha del formulario, solo si tiene la forma AAAA-MM-DD. */
function leerFechaDeLaFicha(formData: FormData, campo: string): string | null {
  const valor = leerTexto(formData, campo);
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
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

/**
 * Plazas de una oportunidad repartida entre varias empresas
 * (migración 0017). Menos de dos plazas no es un reparto: se guarda como
 * null, que es el caso normal de un único patrocinador.
 */
function leerPlazas(formData: FormData): { total: number | null; cubiertas: number } {
  const total = Number.parseInt(String(formData.get("slotsTotal") ?? ""), 10);
  if (!Number.isFinite(total) || total < 2) return { total: null, cubiertas: 0 };

  const cubiertas = Number.parseInt(String(formData.get("slotsTaken") ?? "0"), 10);
  const validas = Number.isFinite(cubiertas) ? Math.min(Math.max(cubiertas, 0), total) : 0;

  return { total, cubiertas: validas };
}

/**
 * Si esto es algo que el club NECESITA y, en ese caso, de qué clase
 * (migración 0038). La categoría solo se guarda cuando es una
 * necesidad: la base de datos lo exige, y con razón — una categoría de
 * necesidad colgando de una oportunidad normal no significa nada.
 */
function leerNecesidad(formData: FormData): {
  esNecesidad: boolean;
  categoria: CategoriaNecesidad | null;
} {
  const esNecesidad = String(formData.get("esNecesidad") ?? "no") === "si";
  if (!esNecesidad) return { esNecesidad: false, categoria: null };

  return {
    esNecesidad: true,
    categoria: leerCategoriaNecesidad(String(formData.get("categoriaNecesidad") ?? "")),
  };
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

  const plazas = leerPlazas(formData);
  const necesidad = leerNecesidad(formData);

  // Lo que el club NECESITA no lleva precio: lo que ofrece es el
  // servicio, y a cambio va visibilidad. El formulario ni siquiera
  // enseña la casilla en ese caso, así que aquí no puede exigirse.
  const value = necesidad.esNecesidad ? 0 : leerValor(formData);
  if (value === null) return { error: "Indica un valor válido (0 o más)." };

  if (necesidad.esNecesidad && !necesidad.categoria) {
    return { error: "Elige qué servicio o producto necesitas." };
  }

  const { error } = await supabase.from("opportunities").insert({
    club_id: user.id,
    title,
    description: leerTexto(formData, "description"),
    opportunity_type: opportunityType,
    value,
    duration: leerTexto(formData, "duration"),
    ...leerFicha(formData),
    frequency: leerTexto(formData, "frecuencia"),
    starts_on: leerFechaDeLaFicha(formData, "desde"),
    ends_on: leerFechaDeLaFicha(formData, "hasta"),
    requirements: leerTexto(formData, "requisitos"),
    period: leerPeriodo(formData),
    collaboration_type: leerFormaColaboracion(formData),
    objectives: leerObjetivos(formData),
    sponsor_level: leerNivelPatrocinio(formData),
    exclusivity: leerTexto(formData, "exclusivity"),
    team_id: await leerEquipo(supabase, user.id, formData),
    slots_total: plazas.total,
    slots_taken: plazas.cubiertas,
    is_need: necesidad.esNecesidad,
    need_category: necesidad.categoria,
  });

  if (error) return { error: "No se ha podido crear la oportunidad." };

  refrescarFichaPublica();
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

  const status = leerEstado(formData) ?? "available";
  const plazas = leerPlazas(formData);
  const necesidad = leerNecesidad(formData);

  // Lo que el club NECESITA no lleva precio: lo que ofrece es el
  // servicio, y a cambio va visibilidad. El formulario ni siquiera
  // enseña la casilla en ese caso, así que aquí no puede exigirse.
  const value = necesidad.esNecesidad ? 0 : leerValor(formData);
  if (value === null) return { error: "Indica un valor válido (0 o más)." };

  if (necesidad.esNecesidad && !necesidad.categoria) {
    return { error: "Elige qué servicio o producto necesitas." };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({
      title,
      description: leerTexto(formData, "description"),
      opportunity_type: opportunityType,
      value,
      duration: leerTexto(formData, "duration"),
      ...leerFicha(formData),
      frequency: leerTexto(formData, "frecuencia"),
      starts_on: leerFechaDeLaFicha(formData, "desde"),
      ends_on: leerFechaDeLaFicha(formData, "hasta"),
      requirements: leerTexto(formData, "requisitos"),
      period: leerPeriodo(formData),
      collaboration_type: leerFormaColaboracion(formData),
      objectives: leerObjetivos(formData),
      sponsor_level: leerNivelPatrocinio(formData),
      exclusivity: leerTexto(formData, "exclusivity"),
      team_id: await leerEquipo(supabase, user.id, formData),
      slots_total: plazas.total,
      slots_taken: plazas.cubiertas,
      is_need: necesidad.esNecesidad,
      need_category: necesidad.categoria,
      status,
    })
    .eq("id", id)
    .eq("club_id", user.id);

  if (error) return { error: "No se ha podido guardar la oportunidad." };

  refrescarFichaPublica();
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

  refrescarFichaPublica();
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
      "title, description, opportunity_type, value, duration, period, collaboration_type, objectives, sponsor_level, exclusivity, team_id, slots_total, is_need, need_category, benefits, actions, frequency, starts_on, ends_on, requirements",
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
    benefits: original.benefits ?? [],
    actions: original.actions ?? [],
    frequency: original.frequency ?? null,
    starts_on: original.starts_on ?? null,
    ends_on: original.ends_on ?? null,
    requirements: original.requirements ?? null,
    period: original.period,
    collaboration_type: original.collaboration_type,
    objectives: original.objectives,
    sponsor_level: original.sponsor_level,
    exclusivity: original.exclusivity,
    team_id: original.team_id,
    // La copia empieza con las plazas a cero: las cubiertas son del
    // original, no de la copia.
    slots_total: original.slots_total,
    slots_taken: 0,
    is_need: original.is_need,
    need_category: original.need_category,
  });

  refrescarFichaPublica();
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

  refrescarFichaPublica();
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

  refrescarFichaPublica();
}

// ---------------------------------------------------------------------
// Eliminar
// ---------------------------------------------------------------------
export async function eliminarOportunidad(formData: FormData): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "No se ha podido identificar qué borrar." };

  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", id)
    .eq("club_id", user.id);

  if (error) return { error: "No se ha podido borrar la oportunidad. Inténtalo de nuevo." };

  refrescarFichaPublica();
  return { ok: true };
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

  refrescarFichaPublica();
}
