"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { registrarConsentimiento } from "@/lib/consent";
import { geocodificarDireccion } from "@/lib/geocoding";
import { CONSENT_TYPES, LEGAL_VERSIONS } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import type { Role, TeamLevel } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_PANEL = "/panel";

/**
 * Recupera el cliente de Supabase y el usuario autenticado, comprobando
 * que tiene rol "club". El middleware ya protege `/panel`, pero cada
 * Server Action se valida a sí misma por si se invocara desde otro sitio.
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

function leerEntero(formData: FormData, campo: string): number | null {
  const valor = String(formData.get(campo) ?? "").trim();
  if (valor === "") return null;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

/** Casillas de verificación: presentes ("on") solo cuando están marcadas. */
function leerBooleano(formData: FormData, campo: string): boolean {
  return formData.get(campo) != null;
}

// ---------------------------------------------------------------------
// 1. Identidad
// ---------------------------------------------------------------------
export async function guardarIdentidad(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const name = leerTexto(formData, "name");
  const city = leerTexto(formData, "city");

  if (!name) return { error: "Indica el nombre del club." };
  if (!city) return { error: "Indica la localidad del club." };

  const socialLinks = {
    instagram: leerTexto(formData, "instagram") ?? undefined,
    facebook: leerTexto(formData, "facebook") ?? undefined,
    twitter: leerTexto(formData, "twitter") ?? undefined,
    tiktok: leerTexto(formData, "tiktok") ?? undefined,
    youtube: leerTexto(formData, "youtube") ?? undefined,
  };

  const contactName = leerTexto(formData, "contactName");
  const contactPhone = leerTexto(formData, "contactPhone");
  const contactPublicConsent = leerBooleano(formData, "contactPublicConsent");

  const province = leerTexto(formData, "province");
  const postalCode = leerTexto(formData, "postalCode");

  const datosClub: Record<string, unknown> = {
    id: user.id,
    name,
    city,
    province,
    postal_code: postalCode,
    facilities: leerTexto(formData, "facilities"),
    website: leerTexto(formData, "website"),
    description: leerTexto(formData, "description"),
    video_url: leerTexto(formData, "videoUrl"),
    social_links: socialLinks,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_public_consent: contactPublicConsent,
  };

  // Fase 7: recalcula las coordenadas del club para el buscador por
  // radio en km. Si Nominatim no responde, no se tocan `latitude`/
  // `longitude` (se quedan con lo que hubiera antes, si algo) en vez de
  // bloquear el guardado del resto del formulario.
  const coordenadas = await geocodificarDireccion({ city, province, postalCode });
  if (coordenadas) {
    datosClub.latitude = coordenadas.latitude;
    datosClub.longitude = coordenadas.longitude;
    datosClub.geocoded_at = new Date().toISOString();
  }

  const { error } = await supabase.from("clubs").upsert(datosClub, { onConflict: "id" });

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Guarda la URL del logo ya subido a Storage (ver ImageUploader). */
export async function guardarLogo(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase
    .from("clubs")
    .update({ logo_url: url })
    .eq("id", user.id);

  if (error) return { error: "No se ha podido guardar el logo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Añade una foto (ya subida a Storage) a la galería del club. */
export async function agregarFoto(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { data: fila } = await supabase
    .from("clubs")
    .select("photo_urls")
    .eq("id", user.id)
    .single();

  const fotosActuales: string[] = fila?.photo_urls ?? [];
  const { error } = await supabase
    .from("clubs")
    .update({ photo_urls: [...fotosActuales, url] })
    .eq("id", user.id);

  if (error) return { error: "No se ha podido guardar la foto." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Quita una foto de la galería del club (no borra el archivo de Storage). */
export async function eliminarFoto(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { data: fila } = await supabase
    .from("clubs")
    .select("photo_urls")
    .eq("id", user.id)
    .single();

  const fotosActuales: string[] = fila?.photo_urls ?? [];
  const { error } = await supabase
    .from("clubs")
    .update({ photo_urls: fotosActuales.filter((foto) => foto !== url) })
    .eq("id", user.id);

  if (error) return { error: "No se ha podido quitar la foto." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/**
 * Registra, con fecha, la confirmación del club (Fase 11) de que las
 * fotos que sube no incluyen a menores identificables sin
 * consentimiento de sus padres o tutores. Se llama cada vez que el
 * club marca la casilla antes de subir una foto (ver `IdentidadForm`),
 * así queda constancia de cada confirmación, no solo de la primera.
 */
export async function registrarConfirmacionMenores(): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  await registrarConsentimiento(
    supabase,
    user.id,
    CONSENT_TYPES.minorsPhotoUpload,
    LEGAL_VERSIONS.minorsPhotoUpload,
  );
}

// ---------------------------------------------------------------------
// 2. Nivel deportivo
// ---------------------------------------------------------------------
export async function guardarNivelDeportivo(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase.from("clubs").upsert(
    {
      id: user.id,
      top_category: leerTexto(formData, "topCategory"),
      competitions: leerTexto(formData, "competitions"),
      achievements: leerTexto(formData, "achievements"),
    },
    { onConflict: "id" },
  );

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 3. Equipos
// ---------------------------------------------------------------------
export async function agregarEquipo(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const sport = leerTexto(formData, "sport");
  if (!sport) return { error: "Indica el deporte del equipo." };

  const teamLevelValor = String(formData.get("teamLevel") ?? "");
  const teamLevel: TeamLevel = teamLevelValor === "cantera" ? "cantera" : "primer_equipo";

  const { error } = await supabase.from("club_teams").insert({
    club_id: user.id,
    sport,
    category: leerTexto(formData, "category"),
    gender: leerTexto(formData, "gender"),
    team_level: teamLevel,
    player_count: leerEntero(formData, "playerCount"),
  });

  if (error) return { error: "No se ha podido añadir el equipo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

export async function eliminarEquipo(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("club_teams").delete().eq("id", id).eq("club_id", user.id);
  revalidatePath(RUTA_PANEL);
}

// ---------------------------------------------------------------------
// 4. Cantera (datos agregados)
// ---------------------------------------------------------------------
export async function guardarCantera(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase.from("clubs").upsert(
    {
      id: user.id,
      youth_teams_count: leerEntero(formData, "youthTeamsCount"),
      youth_players_count: leerEntero(formData, "youthPlayersCount"),
      youth_families_count: leerEntero(formData, "youthFamiliesCount"),
    },
    { onConflict: "id" },
  );

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 5. Historia
// ---------------------------------------------------------------------
export async function guardarHistoria(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  let milestones: unknown = [];
  try {
    milestones = JSON.parse(String(formData.get("milestones") ?? "[]"));
  } catch {
    return { error: "Los hitos no tienen un formato válido." };
  }

  const { error } = await supabase.from("clubs").upsert(
    {
      id: user.id,
      founding_year: leerEntero(formData, "foundingYear"),
      milestones,
    },
    { onConflict: "id" },
  );

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 6. Audiencia
// ---------------------------------------------------------------------
export async function guardarAudiencia(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const followersByNetwork = {
    instagram: leerEntero(formData, "followersInstagram") ?? undefined,
    facebook: leerEntero(formData, "followersFacebook") ?? undefined,
    twitter: leerEntero(formData, "followersTwitter") ?? undefined,
    tiktok: leerEntero(formData, "followersTiktok") ?? undefined,
    youtube: leerEntero(formData, "followersYoutube") ?? undefined,
  };

  const { error } = await supabase.from("clubs").upsert(
    {
      id: user.id,
      followers_by_network: followersByNetwork,
      estimated_reach: leerEntero(formData, "estimatedReach"),
      average_attendance: leerEntero(formData, "averageAttendance"),
    },
    { onConflict: "id" },
  );

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 7. Comunidad
// ---------------------------------------------------------------------
export async function guardarComunidad(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  let communityActions: unknown = [];
  try {
    communityActions = JSON.parse(String(formData.get("communityActions") ?? "[]"));
  } catch {
    return { error: "Las acciones no tienen un formato válido." };
  }

  const { error } = await supabase.from("clubs").upsert(
    { id: user.id, community_actions: communityActions },
    { onConflict: "id" },
  );

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 8. Patrocinadores actuales
// ---------------------------------------------------------------------
export async function agregarPatrocinador(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const name = leerTexto(formData, "name");
  if (!name) return { error: "Indica el nombre del patrocinador." };

  const { error } = await supabase.from("club_sponsors").insert({
    club_id: user.id,
    name,
    website: leerTexto(formData, "website"),
    logo_url: leerTexto(formData, "logoUrl"),
  });

  if (error) return { error: "No se ha podido añadir el patrocinador." };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

export async function eliminarPatrocinador(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("club_sponsors").delete().eq("id", id).eq("club_id", user.id);
  revalidatePath(RUTA_PANEL);
}
