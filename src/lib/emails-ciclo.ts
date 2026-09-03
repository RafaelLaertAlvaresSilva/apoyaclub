import type { SupabaseClient } from "@supabase/supabase-js";
import { routing } from "@/i18n/routing";
import {
  enviarEmailBienvenidaClub,
  enviarEmailBienvenidaEmpresa,
  enviarEmailFichaIncompleta,
  enviarEmailFinDePrueba,
  enviarEmailSolicitudSinAbrir,
  type ResultadoEnvioEmail,
} from "@/lib/email/resend";
import { avisoPendiente, diasDesde, diasHasta } from "@/lib/fechas";
import { avisarDeFallo } from "@/lib/monitoring";
import { SITE_URL } from "@/lib/site";
import {
  clubRowToProfile,
  clubSponsorRowToSponsor,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubSponsorRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import { UMBRAL_FICHA_FLOJA, huecosDelPerfil } from "@/lib/profile-completion";
import type { Role } from "@/lib/types";

/**
 * Los tres avisos por email que dispara el cron diario, aparte del de
 * caducidad que ya existía (migración 0013):
 *
 *   1. bienvenida a quien acaba de confirmar su cuenta,
 *   2. fin del mes gratis, antes de cobrar por primera vez,
 *   3. solicitudes que el club lleva 48 horas sin abrir.
 *
 * Todo lo que se manda una sola vez queda apuntado en `email_log`, y el
 * recordatorio de solicitudes en la propia fila de `contact_requests`.
 * Si Resend no está configurado se marca igual como enviado: lo que no
 * puede pasar es que el cron lo reintente cada día para siempre.
 */

type ClienteAdmin = SupabaseClient;

const URL_PANEL = `${SITE_URL}/${routing.defaultLocale}/panel`;
const URL_SOLICITUDES = `${SITE_URL}/${routing.defaultLocale}/panel/solicitudes`;
const URL_SUSCRIPCION = `${SITE_URL}/${routing.defaultLocale}/panel/suscripcion`;
const URL_BUSCAR = `${SITE_URL}/${routing.defaultLocale}/buscar`;

/** Días desde el alta en los que todavía tiene sentido dar la bienvenida. */
const DIAS_MAXIMOS_BIENVENIDA = 7;
/** Horas que una solicitud puede quedarse sin abrir antes de recordarla. */
const HORAS_SIN_ABRIR = 48;
/** Cuántos días antes del fin de la prueba se avisa. */
const UMBRALES_FIN_PRUEBA = [1, 3];
/**
 * Días desde el alta antes de recordar que la ficha está a medias. Menos
 * sería impaciente: el club acaba de registrarse y aún la está montando.
 */
const DIAS_ANTES_DE_AVISAR_FICHA = 10;
/** Cuántos huecos se enumeran en el correo. Más de tres agobia. */
const HUECOS_EN_EL_EMAIL = 3;

function seDaPorEnviado(resultado: ResultadoEnvioEmail): boolean {
  return resultado.ok || resultado.error === "Envío de email no configurado todavía.";
}

async function yaEnviados(
  admin: ClienteAdmin,
  kinds: string[],
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const { data } = await admin
    .from("email_log")
    .select("user_id, kind")
    .in("kind", kinds)
    .in("user_id", userIds)
    .returns<{ user_id: string; kind: string }[]>();

  return new Set((data ?? []).map((fila) => `${fila.user_id}:${fila.kind}`));
}

async function apuntarEnviado(admin: ClienteAdmin, userId: string, kind: string): Promise<void> {
  await admin.from("email_log").upsert({ user_id: userId, kind }, { onConflict: "user_id,kind" });
}

// ---------------------------------------------------------------------
// 1. Bienvenida
// ---------------------------------------------------------------------
export async function enviarBienvenidas(admin: ClienteAdmin, ahora = new Date()): Promise<number> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido listar los usuarios", error);
    return 0;
  }

  const recientes = (data?.users ?? []).filter((usuario) => {
    if (!usuario.email || !usuario.email_confirmed_at) return false;
    const dias = diasDesde(usuario.created_at, ahora);
    return dias != null && dias <= DIAS_MAXIMOS_BIENVENIDA;
  });

  const enviados = await yaEnviados(
    admin,
    ["welcome_club", "welcome_empresa"],
    recientes.map((usuario) => usuario.id),
  );

  let total = 0;

  for (const usuario of recientes) {
    const rol = usuario.app_metadata?.role as Role | undefined;
    if (rol !== "club" && rol !== "empresa") continue;

    const kind = rol === "club" ? "welcome_club" : "welcome_empresa";
    if (enviados.has(`${usuario.id}:${kind}`)) continue;

    let resultado: ResultadoEnvioEmail;

    if (rol === "club") {
      const { data: club } = await admin
        .from("clubs")
        .select("name")
        .eq("id", usuario.id)
        .maybeSingle<{ name: string }>();

      resultado = await enviarEmailBienvenidaClub({
        clubEmail: usuario.email!,
        clubName: club?.name ?? (usuario.user_metadata?.name as string | undefined) ?? "tu club",
        panelUrl: URL_PANEL,
      });
    } else {
      resultado = await enviarEmailBienvenidaEmpresa({
        companyEmail: usuario.email!,
        buscarUrl: URL_BUSCAR,
      });
    }

    if (seDaPorEnviado(resultado)) await apuntarEnviado(admin, usuario.id, kind);
    if (resultado.ok) total += 1;
  }

  return total;
}

// ---------------------------------------------------------------------
// 2. Fin del mes gratis
// ---------------------------------------------------------------------
type FilaPrueba = { id: string; name: string; trial_ends_at: string | null };

export async function avisarFinDePrueba(admin: ClienteAdmin, ahora = new Date()): Promise<number> {
  const { data: clubes, error } = await admin
    .from("clubs")
    .select("id, name, trial_ends_at")
    .eq("subscription_status", "trialing")
    .eq("cancel_at_period_end", false)
    .not("trial_ends_at", "is", null)
    .returns<FilaPrueba[]>();

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido leer los clubes en prueba", error);
    return 0;
  }

  const filas = clubes ?? [];
  const enviados = await yaEnviados(
    admin,
    ["trial_1d", "trial_3d"],
    filas.map((club) => club.id),
  );

  let total = 0;

  for (const club of filas) {
    const dias = diasHasta(club.trial_ends_at, ahora);
    const yaMandados = UMBRALES_FIN_PRUEBA.filter((umbral) =>
      enviados.has(`${club.id}:trial_${umbral}d`),
    );
    const umbral = avisoPendiente(dias, UMBRALES_FIN_PRUEBA, yaMandados);
    if (!umbral) continue;

    const { data: usuario } = await admin.auth.admin.getUserById(club.id);
    const email = usuario.user?.email;
    if (!email) continue;

    const resultado = await enviarEmailFinDePrueba({
      clubEmail: email,
      clubName: club.name,
      diasRestantes: umbral,
      fechaFin: new Date(club.trial_ends_at!).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      panelUrl: URL_SUSCRIPCION,
    });

    if (seDaPorEnviado(resultado)) await apuntarEnviado(admin, club.id, `trial_${umbral}d`);
    if (resultado.ok) total += 1;
  }

  return total;
}

// ---------------------------------------------------------------------
// 3. Solicitudes sin abrir
// ---------------------------------------------------------------------
type FilaSolicitud = { id: string; club_id: string; created_at: string };

export async function recordarSolicitudesSinAbrir(
  admin: ClienteAdmin,
  ahora = new Date(),
): Promise<number> {
  const limite = new Date(ahora.getTime() - HORAS_SIN_ABRIR * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("contact_requests")
    .select("id, club_id, created_at")
    .eq("status", "new")
    .is("unread_reminder_sent_at", null)
    .lt("created_at", limite)
    .returns<FilaSolicitud[]>();

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido leer las solicitudes sin abrir", error);
    return 0;
  }

  // Un solo email por club, aunque tenga varias solicitudes esperando.
  const porClub = new Map<string, FilaSolicitud[]>();
  for (const solicitud of data ?? []) {
    porClub.set(solicitud.club_id, [...(porClub.get(solicitud.club_id) ?? []), solicitud]);
  }

  let total = 0;

  for (const [clubId, solicitudes] of porClub) {
    const { data: usuario } = await admin.auth.admin.getUserById(clubId);
    const email = usuario.user?.email;
    if (!email) continue;

    const masAntigua = solicitudes.reduce((antigua, actual) =>
      new Date(actual.created_at) < new Date(antigua.created_at) ? actual : antigua,
    );

    const resultado = await enviarEmailSolicitudSinAbrir({
      clubEmail: email,
      total: solicitudes.length,
      diasDeLaMasAntigua: Math.max(diasDesde(masAntigua.created_at, ahora) ?? 2, 2),
      panelUrl: URL_SOLICITUDES,
    });

    if (seDaPorEnviado(resultado)) {
      await admin
        .from("contact_requests")
        .update({ unread_reminder_sent_at: ahora.toISOString() })
        .in(
          "id",
          solicitudes.map((solicitud) => solicitud.id),
        );
    }

    if (resultado.ok) total += 1;
  }

  return total;
}

// ---------------------------------------------------------------------
// 4. Cerrar las pruebas gratuitas que ya han terminado
// ---------------------------------------------------------------------
type FilaPruebaVencida = { id: string; trial_ends_at: string | null };

/**
 * Cierra el mes gratis de los clubes que no han llegado a suscribirse
 * (migración 0018).
 *
 * El mes gratis empieza solo, sin tarjeta, al crear la ficha del club.
 * Alguien tiene que terminarlo: sin esto, una prueba local no caducaría
 * nunca y el club se quedaría publicado gratis para siempre.
 *
 * Solo afecta a quien nunca pasó por Stripe (`stripe_subscription_id` a
 * null): si hay suscripción real, manda el webhook y aquí no se toca
 * nada. Los datos del club no se borran; solo deja de estar publicado,
 * y vuelve en cuanto se suscriba.
 */
export async function cerrarPruebasVencidas(admin: ClienteAdmin, ahora = new Date()): Promise<number> {
  const { data, error } = await admin
    .from("clubs")
    .select("id, trial_ends_at")
    .eq("subscription_status", "trialing")
    .is("stripe_subscription_id", null)
    .lt("trial_ends_at", ahora.toISOString())
    .returns<FilaPruebaVencida[]>();

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido leer las pruebas vencidas", error);
    return 0;
  }

  const vencidas = data ?? [];
  if (vencidas.length === 0) return 0;

  const { error: errorActualizando } = await admin
    .from("clubs")
    .update({ subscription_status: "canceled" })
    .in(
      "id",
      vencidas.map((club) => club.id),
    );

  if (errorActualizando) {
    avisarDeFallo("cron-suscripciones", "No se han podido cerrar las pruebas vencidas", errorActualizando);
    return 0;
  }

  return vencidas.length;
}

// ---------------------------------------------------------------------
// 5. Ficha a medias
// ---------------------------------------------------------------------
type FilaFichaFloja = ClubRow & { profile_score: number | null; created_at: string };

/**
 * Recuerda una sola vez a los clubes con la ficha por debajo del umbral
 * que eso les está costando visibilidad (migración 0020).
 *
 * Se manda una única vez por club (`email_log`, kind "ficha_incompleta"):
 * un club que decide no rellenar más no tiene que recibir el mismo
 * correo todos los meses. Y no se manda nada más registrarse: hay que
 * darle margen para que la monte él solo.
 */
export async function recordarFichaIncompleta(
  admin: ClienteAdmin,
  ahora = new Date(),
): Promise<number> {
  const limite = new Date(
    ahora.getTime() - DIAS_ANTES_DE_AVISAR_FICHA * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("clubs")
    .select("*")
    .lt("profile_score", UMBRAL_FICHA_FLOJA)
    .lt("created_at", limite)
    .in("subscription_status", ["trialing", "active"])
    .returns<FilaFichaFloja[]>();

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido leer las fichas incompletas", error);
    return 0;
  }

  const candidatos = data ?? [];
  if (candidatos.length === 0) return 0;

  const yaAvisados = await yaEnviados(
    admin,
    ["ficha_incompleta"],
    candidatos.map((club) => club.id),
  );

  let total = 0;

  for (const fila of candidatos) {
    if (yaAvisados.has(`${fila.id}:ficha_incompleta`)) continue;

    const { data: usuario } = await admin.auth.admin.getUserById(fila.id);
    const email = usuario.user?.email;
    if (!email) continue;

    // Los huecos se calculan con el perfil ya mapeado; equipos y
    // patrocinadores se piden aparte porque viven en sus propias tablas.
    const [{ data: equipos }, { data: patrocinadores }] = await Promise.all([
      admin.from("club_teams").select("*").eq("club_id", fila.id).returns<ClubTeamRow[]>(),
      admin.from("club_sponsors").select("*").eq("club_id", fila.id).returns<ClubSponsorRow[]>(),
    ]);

    const huecos = huecosDelPerfil(
      clubRowToProfile(fila),
      (equipos ?? []).map(clubTeamRowToTeam),
      (patrocinadores ?? []).map(clubSponsorRowToSponsor),
    );

    if (huecos.length === 0) continue;

    const resultado = await enviarEmailFichaIncompleta({
      clubEmail: email,
      clubName: fila.name,
      porcentaje: fila.profile_score ?? 0,
      huecos: huecos.slice(0, HUECOS_EN_EL_EMAIL).map((hueco) => hueco.titulo),
      panelUrl: URL_PANEL,
    });

    if (seDaPorEnviado(resultado)) {
      await apuntarEnviado(admin, fila.id, "ficha_incompleta");
    }

    if (resultado.ok) total += 1;
  }

  return total;
}
