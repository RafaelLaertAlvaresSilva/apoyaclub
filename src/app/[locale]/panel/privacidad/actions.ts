"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { BUCKET_MEDIA_CLUB } from "@/lib/club-storage";
import { obtenerStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_DOCUMENTOS, todasLasRutasDelClub } from "@/lib/documentos-datos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoEliminacion = { error: string } | null;

const TEXTO_CONFIRMACION = "ELIMINAR";
const CARPETAS_MEDIA = ["logo", "fotos", "patrocinadores"] as const;

/**
 * Igual que `obtenerClubActual` de `app/panel/actions.ts`: cada Server
 * Action se valida a sí misma (sesión + rol "club"), aunque el
 * middleware ya protege `/panel`.
 */
async function obtenerClubActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const t = await getTranslations("panel.acciones");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("tuSesionCaducadoVuelveIniciar") };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "club") {
    return { error: t("estaAccionSoloEstaDisponible") };
  }

  return { supabase, user };
}

/**
 * Elimina de forma permanente la cuenta del club (Fase 11: derecho de
 * supresión): cancela cualquier suscripción de Stripe en curso, borra
 * las imágenes de Storage y elimina el usuario de Auth. El resto de
 * filas (perfil, equipos, patrocinadores, oportunidades, dossier,
 * solicitudes de contacto, consentimientos) se borran solas por las
 * claves foráneas `on delete cascade` definidas en las migraciones.
 *
 * No hay vuelta atrás: no hay una fase de "papelera" ni de recuperación.
 */
export async function eliminarCuentaClub(
  _estadoPrevio: EstadoEliminacion,
  formData: FormData,
): Promise<EstadoEliminacion> {
  const t = await getTranslations("panel.acciones");
  const contexto = await obtenerClubActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const confirmacion = String(formData.get("confirmacion") ?? "").trim();
  // La palabra se pide en el idioma de la pantalla ("ELIMINAR",
  // "ELIMINAR", "DELETE"); la española vale siempre.
  const palabra = (await getTranslations("panel.privacidad"))("eliminar");
  if (confirmacion !== palabra && confirmacion !== TEXTO_CONFIRMACION) {
    return { error: t("escribePalabra", { palabra }) };
  }

  const { data: filaClub } = await supabase
    .from("clubs")
    .select("stripe_subscription_id, name, city, province, plan, subscription_status, created_at")
    .eq("id", user.id)
    .maybeSingle<FilaAntesDeIrse>();

  if (filaClub?.stripe_subscription_id) {
    try {
      await obtenerStripe().subscriptions.cancel(filaClub.stripe_subscription_id);
    } catch (excepcion) {
      console.error("[eliminar cuenta] No se ha podido cancelar la suscripción de Stripe:", excepcion);
      return {
        error:
          t("podidoCancelarTuSuscripcionStripe"),
      };
    }
  }

  for (const carpeta of CARPETAS_MEDIA) {
    const { data: archivos } = await supabase.storage.from(BUCKET_MEDIA_CLUB).list(`${user.id}/${carpeta}`);
    if (archivos && archivos.length > 0) {
      const rutas = archivos.map((archivo) => `${user.id}/${carpeta}/${archivo.name}`);
      await supabase.storage.from(BUCKET_MEDIA_CLUB).remove(rutas);
    }
  }

  // Los contratos y las facturas (migración 0051), que viven en otro
  // almacén. Las FILAS se van solas al borrar el usuario, por la clave
  // ajena; los ARCHIVOS no, porque el almacén no sabe nada de claves
  // ajenas. Si no se barren aquí, el derecho de supresión se queda a
  // medias: el club desaparece y sus contratos siguen guardados.
  //
  // Y hay que leer las rutas ANTES de borrar al usuario, que es lo que
  // se hace unas líneas más abajo: después ya no habría filas de donde
  // sacarlas.
  const rutasDeDocumentos = await todasLasRutasDelClub(supabase, user.id);
  if (rutasDeDocumentos.length > 0) {
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove(rutasDeDocumentos);
  }

  const admin = createAdminClient();

  // La baja se apunta ANTES de borrar nada: después de esta línea la
  // fila del club ya no existe y no habría de dónde sacar el nombre.
  // Si el apunte falla, la cuenta se borra igual — el derecho de
  // supresión no puede quedarse esperando a que funcione una
  // estadística.
  await apuntarLaBaja(admin, user.id, filaClub ?? null, leerMotivo(formData));

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[eliminar cuenta] No se ha podido eliminar el usuario:", error);
    return { error: t("podidoEliminarCuentaIntentaloNuevo") };
  }

  await supabase.auth.signOut();
  const locale = await getLocale();
  return redirect({ href: "/cuenta-eliminada", locale });
}

/** Lo que hay que leer de la fila del club antes de que desaparezca. */
type FilaAntesDeIrse = {
  stripe_subscription_id: string | null;
  name: string | null;
  city: string | null;
  province: string | null;
  plan: string | null;
  subscription_status: string | null;
  created_at: string | null;
};

/** El motivo que el club haya querido contar. Es voluntario. */
function leerMotivo(formData: FormData): string | null {
  const texto = String(formData.get("motivo") ?? "").trim();
  return texto ? texto.slice(0, 500) : null;
}

/**
 * Deja constancia de la baja (migración 0045).
 *
 * Lo que se guarda es de la entidad, no de la persona: el nombre del
 * club, dónde está, qué plan tenía y cuánto duró. Ni correo, ni
 * teléfono, ni persona de contacto: eso se va con la cuenta, como tiene
 * que irse.
 *
 * Nunca hace fallar la baja. Si esto no se puede escribir, el club se
 * va igual y ApoyaClub se queda sin el dato, que es el orden correcto
 * de prioridades.
 */
async function apuntarLaBaja(
  admin: ReturnType<typeof createAdminClient>,
  clubId: string,
  fila: FilaAntesDeIrse | null,
  motivo: string | null,
): Promise<void> {
  try {
    await admin.from("club_closures").insert({
      club_id: clubId,
      club_name: fila?.name ?? "(sin nombre)",
      city: fila?.city ?? null,
      province: fila?.province ?? null,
      plan: fila?.plan ?? null,
      subscription_status: fila?.subscription_status ?? null,
      // Solo cuenta como pagador quien salió de la prueba: en
      // "trialing" no ha pasado por caja todavía.
      ever_paid: !!fila?.stripe_subscription_id && fila.subscription_status !== "trialing",
      signed_up_at: fila?.created_at ?? null,
      closed_by: "club",
      reason: motivo,
    });
  } catch (excepcion) {
    console.error("[eliminar cuenta] No se ha podido apuntar la baja:", excepcion);
  }
}

/**
 * El club decide si se le ve en la web (migración 0055).
 *
 * Ocultarse no borra ni pierde nada: la página, las oportunidades y lo
 * que necesita siguen guardados, solo dejan de salir en lo público. Es
 * para el club que está preparando su ficha y no quiere enseñarla a
 * medias, o para el que en verano no busca patrocinador.
 *
 * Lo escribe el propio club con su sesión, a diferencia del modo de
 * pruebas, que es del administrador.
 */
export async function cambiarVisibilidadClub(formData: FormData): Promise<void> {
  const contexto = await obtenerClubActual();
  const locale = await getLocale();
  if ("error" in contexto) return redirect({ href: "/login", locale });

  const ocultar = formData.get("ocultar") === "si";
  await contexto.supabase
    .from("clubs")
    .update({ hidden_by_club: ocultar, hidden_by_club_at: ocultar ? new Date().toISOString() : null })
    .eq("id", contexto.user.id);

  // El aviso de arriba del panel y el enlace a la página pública
  // dependen de esto, y salen del layout.
  revalidatePath("/[locale]/panel", "layout");
  return redirect({ href: "/panel/privacidad?visibilidad=guardada", locale });
}
