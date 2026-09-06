"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { registrarConsentimiento } from "@/lib/consent";
import { enviarEmailAvisoPatrocinador } from "@/lib/email/resend";
import { geocodificarDireccion } from "@/lib/geocoding";
import { consumirLimite } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { CONSENT_TYPES, LEGAL_VERSIONS } from "@/lib/legal";
import { getTranslations } from "next-intl/server";
import { esCategoriaValida } from "@/lib/service-needs";
import { createClient } from "@/lib/supabase/server";
import { NIVELES_PATROCINADOR } from "@/lib/types";
import type { Milestone, Role, SponsorTier, TeamLevel } from "@/lib/types";

export type EstadoGuardado =
  | { error: string; ok?: false }
  /**
   * `nota` es para lo que salió bien a medias: el patrocinador se
   * guardó pero su correo no llegó a salir. Fallar entero sería mentir
   * (el patrocinador está guardado) y callarlo también (el club se
   * quedaría creyendo que la empresa recibió el aviso).
   */
  | { ok: true; error?: undefined; nota?: string }
  | null;

const RUTA_PANEL = "/panel";

/** Tope de avisos a patrocinadores que puede mandar un club en un día. */
const AVISOS_PATROCINADOR_AL_DIA = 20;

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
/**
 * Convierte un error de Supabase en el mensaje que ve el club, sin
 * perder por el camino lo que de verdad ha pasado.
 *
 * Hasta ahora estas acciones devolvían "No se ha podido guardar" y
 * tiraban el error a la basura, así que cuando algo fallaba no había
 * absolutamente nada con lo que averiguar por qué. Ahora queda escrito
 * en el servidor siempre, y en desarrollo se enseña también en pantalla:
 * cuando el que prueba la web es el que la ha encargado, esconderle la
 * causa no protege a nadie.
 */
function fallo(operacion: string, error: unknown, mensaje: string): { error: string } {
  const detalle = error as { message?: string; code?: string; details?: string; hint?: string } | null;

  console.error(
    `[panel] ${operacion} ha fallado:`,
    JSON.stringify(
      {
        code: detalle?.code,
        message: detalle?.message,
        details: detalle?.details,
        hint: detalle?.hint,
      },
      null,
      2,
    ),
  );

  // Caso aparte porque tiene una causa concreta y una solución concreta:
  // la base de datos comprueba el permiso mirando el testigo de sesión
  // del navegador, no la cuenta. Si ese testigo se emitió antes de que la
  // cuenta tuviera el rol de club, el servidor la ve como club y la base
  // de datos no, y el club se queda sin poder guardar nada sin saber por
  // qué. Volver a entrar emite un testigo nuevo y ya con el rol dentro.
  if (esFalloDePermisos(detalle)) {
    return {
      error:
        "Tu sesión no tiene permiso para guardar. Cierra sesión, vuelve a entrar e inténtalo otra vez. Si sigue pasando, escríbenos.",
    };
  }

  if (process.env.NODE_ENV !== "production" && detalle?.message) {
    return { error: `${mensaje} (motivo técnico: ${detalle.message})` };
  }

  return { error: mensaje };
}

/** true si Postgres ha rechazado la escritura por las reglas de acceso. */
function esFalloDePermisos(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  // 42501 = insufficient_privilege. El texto cubre el caso de PostgREST,
  // que a veces devuelve el mensaje sin el código.
  return error.code === "42501" || (error.message ?? "").includes("row-level security");
}

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
  const contactEmail = leerTexto(formData, "contactEmail");

  // Se comprueba aquí además de en la base de datos para poder decir qué
  // pasa: un fallo de restricción llegaría como "no se ha podido guardar".
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail)) {
    return { error: "El correo de contacto no parece válido." };
  }
  const contactPublicConsent = leerBooleano(formData, "contactPublicConsent");

  const province = leerTexto(formData, "province");
  const postalCode = leerTexto(formData, "postalCode");

  const datosClub: Record<string, unknown> = {
    id: user.id,
    name,
    city,
    province,
    postal_code: postalCode,
    website: leerTexto(formData, "website"),
    description: leerTexto(formData, "description"),
    video_url: leerTexto(formData, "videoUrl"),
    social_links: socialLinks,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    contact_hours: leerTexto(formData, "contactHours"),
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

  // Esta es la única sección que puede crear la fila del club (nombre y
  // localidad son obligatorios). El resto usan `update` a propósito: un
  // `upsert` intenta primero un INSERT, que revienta contra el NOT NULL
  // de `name` antes siquiera de darse cuenta de que la fila ya existía.
  const { error } = await supabase.from("clubs").upsert(datosClub, { onConflict: "id" });

  if (error) return fallo("guardarIdentidad", error, "No se ha podido guardar. Inténtalo de nuevo.");

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

  if (error) return fallo("guardarLogo", error, "No se ha podido guardar el logo.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Guarda la imagen de cabecera de la ficha (migración 0025). */
export async function guardarPortada(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase.from("clubs").update({ cover_url: url }).eq("id", user.id);

  if (error) return fallo("guardarPortada", error, "No se ha podido guardar la portada.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/**
 * Guarda a qué altura se corta la portada (migración 0026).
 *
 * La portada es una franja muy baja de una foto apaisada: por defecto se
 * coge la del centro, y eso deja fuera justo lo que importa la mitad de
 * las veces.
 */
export async function guardarPosicionPortada(posicion: number): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  if (!Number.isFinite(posicion)) return { error: "Posición no válida." };
  const acotada = Math.min(100, Math.max(0, Math.round(posicion)));

  const { error } = await supabase
    .from("clubs")
    .update({ cover_position: acotada })
    .eq("id", user.id);

  if (error) return fallo("guardarPosicionPortada", error, "No se ha podido guardar el encuadre.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Quita la imagen de cabecera (no borra el archivo de Storage). */
export async function quitarPortada(): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase.from("clubs").update({ cover_url: null }).eq("id", user.id);

  if (error) return fallo("quitarPortada", error, "No se ha podido quitar la portada.");

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

  if (error) return fallo("guardarFoto", error, "No se ha podido guardar la foto.");

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

  if (error) return fallo("quitarFoto", error, "No se ha podido quitar la foto.");

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

  const { error } = await supabase
    .from("clubs")
    .update({
      top_category: resumenDeCategorias(
        leerTexto(formData, "topCategoryMale"),
        leerTexto(formData, "topCategoryFemale"),
      ),
      top_category_male: leerTexto(formData, "topCategoryMale"),
      top_category_female: leerTexto(formData, "topCategoryFemale"),
      top_category_male_photo: leerTexto(formData, "topCategoryMalePhoto"),
      top_category_female_photo: leerTexto(formData, "topCategoryFemalePhoto"),
      competitions: leerTexto(formData, "competitions"),
      achievements: leerTexto(formData, "achievements"),
    })
    .eq("id", user.id);

  if (error) return fallo("guardarNivelDeportivo", error, "No se ha podido guardar. Inténtalo de nuevo.");

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
    photo_url: leerTexto(formData, "photoUrl"),
  });

  if (error) return fallo("agregarEquipo", error, "No se ha podido añadir el equipo.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/**
 * Pone o quita la foto de un equipo ya dado de alta (migración 0036).
 *
 * Va aparte del alta porque un equipo se crea en un momento y la foto
 * aparece después: la del año pasado ya no vale, la de este todavía no
 * la han hecho. Obligar a rehacer el equipo para cambiarle la foto
 * habría sido garantizar que nadie las cambia.
 */
export async function guardarFotoEquipo(equipoId: string, url: string | null): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase
    .from("club_teams")
    .update({ photo_url: url })
    .eq("id", equipoId)
    .eq("club_id", user.id);

  if (error) return fallo("guardarFotoEquipo", error, "No se ha podido guardar la foto.");

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

  const { error } = await supabase
    .from("clubs")
    .update({
      youth_teams_count: leerEntero(formData, "youthTeamsCount"),
      youth_players_count: leerEntero(formData, "youthPlayersCount"),
      youth_families_count: leerEntero(formData, "youthFamiliesCount"),
    })
    .eq("id", user.id);

  if (error) return fallo("guardarCantera", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

// ---------------------------------------------------------------------
// 4 bis. Instalaciones (migración 0025)
// ---------------------------------------------------------------------
/**
 * Dónde juega el club: dirección, descripción y fotos.
 *
 * Antes era un único campo de texto suelto dentro de Identidad. Para una
 * empresa que se plantea poner una lona, dónde está el pabellón y qué
 * pinta tiene es justo lo que quiere saber, así que se le da sitio
 * propio.
 */
export async function guardarInstalaciones(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { error } = await supabase
    .from("clubs")
    .update({
      facilities: leerTexto(formData, "facilities"),
      facilities_address: leerTexto(formData, "facilitiesAddress"),
    })
    .eq("id", user.id);

  if (error) return fallo("guardarInstalaciones", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Añade una foto de las instalaciones (ya subida a Storage). */
export async function agregarFotoInstalacion(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { data: fila } = await supabase
    .from("clubs")
    .select("facilities_photos")
    .eq("id", user.id)
    .single();

  const actuales: string[] = fila?.facilities_photos ?? [];
  const { error } = await supabase
    .from("clubs")
    .update({ facilities_photos: [...actuales, url] })
    .eq("id", user.id);

  if (error) return fallo("agregarFotoInstalacion", error, "No se ha podido guardar la foto.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/** Quita una foto de las instalaciones (no borra el archivo de Storage). */
export async function eliminarFotoInstalacion(url: string): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { data: fila } = await supabase
    .from("clubs")
    .select("facilities_photos")
    .eq("id", user.id)
    .single();

  const actuales: string[] = fila?.facilities_photos ?? [];
  const { error } = await supabase
    .from("clubs")
    .update({ facilities_photos: actuales.filter((foto) => foto !== url) })
    .eq("id", user.id);

  if (error) return fallo("eliminarFotoInstalacion", error, "No se ha podido quitar la foto.");

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

  let milestones: Milestone[];
  try {
    milestones = sanearHitos(JSON.parse(String(formData.get("milestones") ?? "[]")));
  } catch {
    return { error: "Los hitos no tienen un formato válido." };
  }

  const { error } = await supabase
    .from("clubs")
    .update({
      founding_year: leerEntero(formData, "foundingYear"),
      milestones,
    })
    .eq("id", user.id);

  if (error) return fallo("guardarHistoria", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/**
 * Deja los hitos en una forma conocida antes de guardarlos.
 *
 * Vienen del navegador como un JSON que ha construido el propio
 * formulario, así que nada impide que llegue otra cosa. Y los enlaces de
 * vídeo se pintan después como enlaces en la ficha pública: sin filtrar
 * el esquema, un `javascript:...` guardado aquí se ejecutaría en el
 * navegador de quien visite la página. Solo se aceptan http y https.
 */
function sanearHitos(valor: unknown): Milestone[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .slice(0, 50)
    .map((bruto): Milestone | null => {
      if (typeof bruto !== "object" || bruto === null) return null;
      const hito = bruto as Record<string, unknown>;

      const year = Number.parseInt(String(hito.year ?? ""), 10);
      const text = typeof hito.text === "string" ? hito.text.trim().slice(0, 300) : "";

      if (!Number.isFinite(year) || year < 1800 || year > 2100 || !text) return null;

      return {
        year,
        text,
        photoUrl: enlaceSeguro(hito.photoUrl),
        videoUrl: enlaceSeguro(hito.videoUrl),
      };
    })
    .filter((hito): hito is Milestone => hito !== null);
}

/** Devuelve la URL si es http(s) y de longitud razonable; null si no. */
function enlaceSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (!texto || texto.length > 2048) return null;

  try {
    const url = new URL(texto);
    return url.protocol === "http:" || url.protocol === "https:" ? texto : null;
  } catch {
    return null;
  }
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

  const { error } = await supabase
    .from("clubs")
    .update({
      followers_by_network: followersByNetwork,
      estimated_reach: leerEntero(formData, "estimatedReach"),
      average_attendance: leerEntero(formData, "averageAttendance"),
    })
    .eq("id", user.id);

  if (error) return fallo("guardarAudiencia", error, "No se ha podido guardar. Inténtalo de nuevo.");

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

  const { error } = await supabase
    .from("clubs")
    .update({ community_actions: communityActions })
    .eq("id", user.id);

  if (error) return fallo("guardarComunidad", error, "No se ha podido guardar. Inténtalo de nuevo.");

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

  const nivel = leerNivelPatrocinador(formData);
  if ("error" in nivel) return { error: nivel.error };

  const descripcion = leerTexto(formData, "description");
  if (descripcion && descripcion.length > 400) {
    return { error: "El texto del patrocinador no puede pasar de 400 caracteres." };
  }

  const correoEmpresa = leerCorreoEmpresa(formData);
  if ("error" in correoEmpresa) return { error: correoEmpresa.error };

  // Va al final de su categoría: el club reordena después si quiere.
  const { data: ultimo } = await supabase
    .from("club_sponsors")
    .select("sort_order")
    .eq("club_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  const { data: nuevo, error } = await supabase
    .from("club_sponsors")
    .insert({
      club_id: user.id,
      name,
      website: leerTexto(formData, "website"),
      logo_url: leerTexto(formData, "logoUrl"),
      tier: nivel.tier,
      tier_label: nivel.tierLabel,
      description: descripcion,
      since_year: leerAnio(formData, "sinceYear"),
      contact_email: correoEmpresa.valor,
      sort_order: (ultimo?.sort_order ?? 0) + 1,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) return fallo("agregarPatrocinador", error, "No se ha podido añadir el patrocinador.");

  revalidatePath(RUTA_PANEL);

  // El agradecimiento sale aquí mismo, sin un segundo viaje. La casilla
  // del formulario viene marcada y el texto de al lado dice lo que va a
  // pasar, así que dejarla marcada ES la declaración de que el club
  // tiene relación con esa empresa.
  //
  // Si el correo falla, el patrocinador se queda guardado igual y se
  // avisa aparte: fallar entero por un correo sería tirar el trabajo
  // que el club acaba de hacer.
  if (correoEmpresa.valor && nuevo?.id && !leerBooleano(formData, "noAvisar")) {
    const aviso = await enviarAvisoAPatrocinador(supabase, user, nuevo.id);
    if ("error" in aviso) {
      return { ok: true, nota: `Patrocinador guardado, pero el aviso no ha salido: ${aviso.error}` };
    }
    return { ok: true, nota: `Guardado. Se le ha mandado el agradecimiento a ${name}.` };
  }

  return { ok: true };
}

/**
 * Edición de un patrocinador ya dado de alta. El logo solo se toca si
 * viene uno nuevo en el formulario: así el club puede cambiar el texto o
 * la categoría sin tener que volver a subir la imagen.
 */
export async function editarPatrocinador(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha podido identificar el patrocinador." };

  const name = leerTexto(formData, "name");
  if (!name) return { error: "Indica el nombre del patrocinador." };

  const nivel = leerNivelPatrocinador(formData);
  if ("error" in nivel) return { error: nivel.error };

  const descripcion = leerTexto(formData, "description");
  if (descripcion && descripcion.length > 400) {
    return { error: "El texto del patrocinador no puede pasar de 400 caracteres." };
  }

  const correoEmpresa = leerCorreoEmpresa(formData);
  if ("error" in correoEmpresa) return { error: correoEmpresa.error };

  const logoUrl = leerTexto(formData, "logoUrl");

  const { error } = await supabase
    .from("club_sponsors")
    .update({
      name,
      website: leerTexto(formData, "website"),
      tier: nivel.tier,
      tier_label: nivel.tierLabel,
      description: descripcion,
      since_year: leerAnio(formData, "sinceYear"),
      contact_email: correoEmpresa.valor,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", id)
    .eq("club_id", user.id);

  if (error) return fallo("editarPatrocinador", error, "No se han podido guardar los cambios.");

  revalidatePath(RUTA_PANEL);

  // Mismo criterio que en el alta. Cubre el caso corriente de un
  // patrocinador que se dio de alta sin correo y al que se le añade
  // después: `enviarAvisoAPatrocinador` ya se encarga de no repetirlo
  // si a esa empresa se le escribió antes.
  if (correoEmpresa.valor && !leerBooleano(formData, "noAvisar")) {
    const aviso = await enviarAvisoAPatrocinador(supabase, user, id);
    if ("error" in aviso) {
      // "Ya se le avisó" no es un fallo del que haya que informar: es
      // lo normal al editar cualquier otra cosa de un patrocinador al
      // que ya se escribió en su día.
      if (aviso.error.startsWith("A esta empresa ya se le avisó")) return { ok: true };
      return { ok: true, nota: `Cambios guardados, pero el aviso no ha salido: ${aviso.error}` };
    }
    return { ok: true, nota: `Cambios guardados. Se le ha mandado el agradecimiento a ${name}.` };
  }

  return { ok: true };
}

/**
 * Sube o baja un patrocinador dentro de la lista. Se intercambia el
 * `sort_order` con el vecino en la misma dirección, que es lo bastante
 * simple para no necesitar transacción: si la segunda escritura fallase,
 * los dos quedarían con el mismo orden y se desempataría por fecha.
 */
export async function moverPatrocinador(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const direccion = String(formData.get("direccion") ?? "");
  if (!id || (direccion !== "arriba" && direccion !== "abajo")) return;

  const { data: filas } = await supabase
    .from("club_sponsors")
    .select("id, sort_order")
    .eq("club_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<{ id: string; sort_order: number }[]>();

  if (!filas) return;

  const posicion = filas.findIndex((fila) => fila.id === id);
  const destino = direccion === "arriba" ? posicion - 1 : posicion + 1;
  if (posicion === -1 || destino < 0 || destino >= filas.length) return;

  const actual = filas[posicion];
  const vecino = filas[destino];

  // Si vinieran empatados a 0 (filas antiguas), se usan las posiciones
  // para que el intercambio tenga efecto igualmente.
  const ordenActual = actual.sort_order === vecino.sort_order ? posicion : actual.sort_order;
  const ordenVecino = actual.sort_order === vecino.sort_order ? destino : vecino.sort_order;

  await supabase
    .from("club_sponsors")
    .update({ sort_order: ordenVecino })
    .eq("id", actual.id)
    .eq("club_id", user.id);
  await supabase
    .from("club_sponsors")
    .update({ sort_order: ordenActual })
    .eq("id", vecino.id)
    .eq("club_id", user.id);

  revalidatePath(RUTA_PANEL);
}

/** Correo de la empresa patrocinadora, validado o vacío. */
function leerCorreoEmpresa(formData: FormData): { valor: string | null } | { error: string } {
  const correo = leerTexto(formData, "contactEmail");
  if (!correo) return { valor: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return { error: "El correo de la empresa no parece válido." };
  }
  return { valor: correo };
}

/**
 * Manda a un patrocinador el agradecimiento del club, con el enlace a su
 * página (migración 0027).
 *
 * Cuatro condiciones, y ninguna es opcional:
 *
 *   1. Lo manda el CLUB, a su nombre y con su correo para responder. La
 *      relación previa que justifica escribir a esa empresa es la suya,
 *      no la de ApoyaClub.
 *   2. El club confirma, y queda con fecha, que esa empresa colabora con
 *      él y que tiene relación con esa dirección.
 *   3. Un solo correo por empresa. Nunca un segundo.
 *   4. Un tope diario por club, porque sin él esto es una máquina de
 *      spam regalada.
 *
 * Escribir a una empresa que no ha dado su dirección a nadie es spam en
 * el sentido legal, y la consecuencia práctica más probable no es una
 * multa: es que el dominio se queme y dejen de llegar los correos que sí
 * importan, que son las solicitudes de contacto.
 */
/**
 * Manda el agradecimiento a un patrocinador. Lo usan dos sitios: el
 * alta del patrocinador (donde va marcado por defecto) y el botón
 * suelto de su ficha, para los que se dieron de alta antes o se
 * dejaron sin avisar.
 *
 * Condiciones, y ninguna es opcional:
 *
 *   - Tiene que haber un correo de la empresa.
 *   - Solo se escribe UNA vez a cada empresa. No es una lista de
 *     correo: es un aviso único, y repetirlo lo convertiría en spam.
 *   - Hay un tope diario por club, para que nadie use esto como
 *     herramienta de envío masivo.
 *   - Y queda guardado que el club declaró tener relación con esa
 *     empresa antes de que el correo salga.
 */
async function enviarAvisoAPatrocinador(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
  patrocinadorId: string,
): Promise<{ ok: true } | { error: string }> {
  const { data: patrocinador } = await supabase
    .from("club_sponsors")
    .select("id, name, contact_email, notified_at")
    .eq("id", patrocinadorId)
    .eq("club_id", user.id)
    .maybeSingle<{
      id: string;
      name: string;
      contact_email: string | null;
      notified_at: string | null;
    }>();

  if (!patrocinador) return { error: "No se ha encontrado ese patrocinador." };
  if (!patrocinador.contact_email) return { error: "Añade primero el correo de la empresa." };
  if (patrocinador.notified_at) {
    return { error: "A esta empresa ya se le avisó. Solo se le escribe una vez." };
  }

  const dentroDelCupo = await consumirLimite({
    bucket: "aviso-patrocinador",
    identificador: user.id,
    limite: AVISOS_PATROCINADOR_AL_DIA,
    ventanaSegundos: 24 * 60 * 60,
  });

  if (!dentroDelCupo) {
    return { error: `Has avisado a ${AVISOS_PATROCINADOR_AL_DIA} empresas hoy. Continúa mañana.` };
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("name, slug, contact_email")
    .eq("id", user.id)
    .maybeSingle<{ name: string; slug: string; contact_email: string | null }>();

  if (!club?.slug) {
    return { error: "Completa antes la identidad de tu club: el correo lleva el enlace a tu página." };
  }

  // La confirmación se guarda ANTES de enviar. Si el envío fallara, lo
  // que no puede quedar es un correo salido sin su confirmación guardada.
  const ahora = new Date().toISOString();
  await supabase
    .from("club_sponsors")
    .update({ relationship_confirmed_at: ahora })
    .eq("id", patrocinador.id)
    .eq("club_id", user.id);

  const resultado = await enviarEmailAvisoPatrocinador({
    empresaEmail: patrocinador.contact_email,
    clubNombre: club.name,
    urlFicha: `${SITE_URL}/${routing.defaultLocale}/club/${club.slug}`,
    responderA: club.contact_email ?? user.email ?? undefined,
  });

  if (!resultado.ok) {
    return {
      error:
        resultado.error === "Envío de email no configurado todavía."
          ? "El envío de correos todavía no está configurado en la plataforma."
          : "No se ha podido enviar el aviso. Inténtalo más tarde.",
    };
  }

  await supabase
    .from("club_sponsors")
    .update({ notified_at: ahora })
    .eq("id", patrocinador.id)
    .eq("club_id", user.id);

  return { ok: true };
}

/**
 * El botón suelto de la ficha del patrocinador, para los que se
 * quedaron sin avisar en el alta. Aquí sí se pide marcar la casilla de
 * relación: es un envío que se dispara solo y a propósito, sin el
 * contexto del formulario de alta que ya lo explica.
 */
export async function avisarPatrocinador(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha podido identificar el patrocinador." };

  if (!leerBooleano(formData, "confirmaRelacion")) {
    return {
      error:
        "Marca la confirmación: hace falta que declares que esta empresa colabora contigo y que tienes relación con esa dirección.",
    };
  }

  const resultado = await enviarAvisoAPatrocinador(supabase, user, id);
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath(RUTA_PANEL);
  return { ok: true };
}

/**
 * Lee la categoría del patrocinador del formulario. "otro" obliga a
 * escribir una etiqueta propia; el resto de niveles la dejan a null,
 * como exige la restricción de la migración 0019.
 */
function leerNivelPatrocinador(
  formData: FormData,
): { tier: SponsorTier; tierLabel: string | null } | { error: string } {
  const valor = String(formData.get("tier") ?? "colaborador");
  const tier = NIVELES_PATROCINADOR.includes(valor as SponsorTier)
    ? (valor as SponsorTier)
    : "colaborador";

  if (tier !== "otro") return { tier, tierLabel: null };

  const etiqueta = leerTexto(formData, "tierLabel");
  if (!etiqueta) {
    return { error: 'Escribe cómo quieres llamar a esta categoría (por ejemplo, "Patrocinador técnico").' };
  }
  if (etiqueta.length > 40) {
    return { error: "El nombre de la categoría no puede pasar de 40 caracteres." };
  }

  return { tier, tierLabel: etiqueta };
}

/** Año de cuatro cifras dentro de un rango razonable, o null. */
function leerAnio(formData: FormData, campo: string): number | null {
  const anio = leerEntero(formData, campo);
  if (anio == null) return null;
  return anio >= 1900 && anio <= 2100 ? anio : null;
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

// ---------------------------------------------------------------------
// Servicios que el club necesita (migración 0016)
// ---------------------------------------------------------------------

/**
 * Alta de un servicio que el club busca. Es la otra dirección de la
 * plataforma: no lo que ofrece, sino lo que le hace falta, que es por
 * donde entra la empresa pequeña sin presupuesto de patrocinio.
 */
export async function guardarServicio(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const t = await getTranslations("panel.servicios");

  const title = String(formData.get("title") ?? "").trim();
  const categoria = String(formData.get("category") ?? "");

  if (!title) return { error: t("errorTitulo") };
  if (!esCategoriaValida(categoria)) return { error: t("errorCategoria") };

  const descripcion = String(formData.get("description") ?? "").trim();

  const { error } = await supabase.from("club_service_needs").insert({
    club_id: user.id,
    category: categoria,
    title,
    description: descripcion || null,
  });

  if (error) return { error: t("errorGuardar") };

  revalidatePath("/panel");
  return { ok: true };
}

/** Marca un servicio como cubierto (o lo reabre) sin borrarlo. */
export async function cambiarEstadoServicio(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("status") ?? "");
  if (!id || (estado !== "open" && estado !== "covered")) return;

  await supabase
    .from("club_service_needs")
    .update({ status: estado })
    .eq("id", id)
    .eq("club_id", user.id);

  revalidatePath("/panel");
}

export async function eliminarServicio(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("club_service_needs").delete().eq("id", id).eq("club_id", user.id);

  revalidatePath("/panel");
}

/**
 * La línea que se guarda en `top_category` a partir de las dos
 * categorías por sexo (migración 0035).
 *
 * `top_category` sigue existiendo porque de ella dependen la vista
 * pública, el dossier y la puntuación del perfil. Escribirla aquí, en
 * el mismo guardado que las otras dos, es lo que evita que se
 * descuadren: nunca se tocan por separado.
 */
function resumenDeCategorias(masculina: string | null, femenina: string | null): string | null {
  const partes = [
    masculina ? `${masculina} (masculino)` : null,
    femenina ? `${femenina} (femenino)` : null,
  ].filter((parte): parte is string => parte !== null);

  return partes.length > 0 ? partes.join(" · ") : null;
}
