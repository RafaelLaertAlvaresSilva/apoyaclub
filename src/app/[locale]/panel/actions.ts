"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { registrarConsentimiento } from "@/lib/consent";
import { geocodificarDireccion } from "@/lib/geocoding";
import { CONSENT_TYPES, LEGAL_VERSIONS } from "@/lib/legal";
import { getTranslations } from "next-intl/server";
import { esCategoriaValida } from "@/lib/service-needs";
import { createClient } from "@/lib/supabase/server";
import { NIVELES_PATROCINADOR } from "@/lib/types";
import type { Role, SponsorTier, TeamLevel } from "@/lib/types";

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

  const { error } = await supabase.from("clubs").upsert(
    {
      id: user.id,
      top_category: leerTexto(formData, "topCategory"),
      competitions: leerTexto(formData, "competitions"),
      achievements: leerTexto(formData, "achievements"),
    },
    { onConflict: "id" },
  );

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
  });

  if (error) return fallo("agregarEquipo", error, "No se ha podido añadir el equipo.");

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

  if (error) return fallo("guardarCantera", error, "No se ha podido guardar. Inténtalo de nuevo.");

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

  if (error) return fallo("guardarHistoria", error, "No se ha podido guardar. Inténtalo de nuevo.");

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

  const { error } = await supabase.from("clubs").upsert(
    { id: user.id, community_actions: communityActions },
    { onConflict: "id" },
  );

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

  // Va al final de su categoría: el club reordena después si quiere.
  const { data: ultimo } = await supabase
    .from("club_sponsors")
    .select("sort_order")
    .eq("club_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  const { error } = await supabase.from("club_sponsors").insert({
    club_id: user.id,
    name,
    website: leerTexto(formData, "website"),
    logo_url: leerTexto(formData, "logoUrl"),
    tier: nivel.tier,
    tier_label: nivel.tierLabel,
    description: descripcion,
    since_year: leerAnio(formData, "sinceYear"),
    sort_order: (ultimo?.sort_order ?? 0) + 1,
  });

  if (error) return fallo("agregarPatrocinador", error, "No se ha podido añadir el patrocinador.");

  revalidatePath(RUTA_PANEL);
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
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", id)
    .eq("club_id", user.id);

  if (error) return fallo("editarPatrocinador", error, "No se han podido guardar los cambios.");

  revalidatePath(RUTA_PANEL);
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
