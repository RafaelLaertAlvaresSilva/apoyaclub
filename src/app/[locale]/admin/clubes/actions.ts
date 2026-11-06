"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { fechaDeAccesoValida, fechaDelPlazo, finalDelDia } from "@/lib/acceso-gratuito";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { puedeGestionarPais, type AccesoAdmin } from "@/lib/acceso-admin";
import { accesoAdminDeLaAccion } from "@/lib/acceso-admin-servidor";
import { esPaisValido, paisDeLaCuenta } from "@/lib/paises";
import { MESES_PILOTO, esDelPiloto, plazasPilotoLibres } from "@/lib/piloto";

const RUTA_CLUBES = "/admin/clubes";

/**
 * Qué ha pasado al pulsar un botón del listado.
 *
 * Existe porque el botón de regalar acceso puede negarse por motivos
 * legítimos —el club no ha rellenado su ficha, o ya paga por Stripe— y
 * antes se negaba en silencio: se pulsaba y no ocurría nada, que desde
 * fuera es exactamente igual que un botón roto.
 */
export type AvisoAdmin =
  | "regalado"
  | "sin-ficha"
  | "paga-stripe"
  | "fecha"
  | "no-admin"
  | "suspendido"
  | "reactivado"
  | "modo-pruebas"
  | "fuera-de-pruebas"
  | "verificado"
  | "sin-verificar"
  | "pais-cambiado"
  | "pasado-a-seis-meses"
  | "sin-plazas-piloto";

async function volverConAviso(aviso: AvisoAdmin): Promise<void> {
  const locale = await getLocale();
  redirect({ href: `${RUTA_CLUBES}?aviso=${aviso}`, locale });
}

/**
 * Igual que `obtenerClubActual` en el panel del club (`app/panel/*`):
 * el middleware ya protege `/admin`, pero cada Server Action se
 * comprueba a sí misma. A diferencia de aquel, aquí se devuelve el
 * cliente con la clave de servicio (createAdminClient), porque estas
 * acciones tocan clubes que no son del usuario que las ejecuta —no
 * tendría sentido escribir políticas de RLS "de admin" fila a fila
 * cuando el rol ya se comprueba aquí antes de tocar la base de datos.
 *
 * Un representante puede hacer lo mismo que el administrador, pero
 * solo con los clubes de su país: se comprueba el país del club que
 * llega en el formulario, no el que diga la página, porque el
 * formulario lo puede reescribir cualquiera desde su navegador.
 */
async function obtenerAdminActual(
  idClub: string,
): Promise<{ admin: ReturnType<typeof createAdminClient>; acceso: AccesoAdmin } | { error: string }> {
  const acceso = await accesoAdminDeLaAccion();
  if (!acceso || !idClub) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const admin = createAdminClient();

  if (acceso.tipo === "representante") {
    const { data } = await admin.auth.admin.getUserById(idClub);
    const cuenta = data?.user;
    if (!cuenta || cuenta.app_metadata?.role !== "club") {
      return { error: "Ese club no existe." };
    }
    if (!puedeGestionarPais(acceso, paisDeLaCuenta(cuenta.app_metadata))) {
      return { error: "Ese club no es de tu país." };
    }
  }

  return { admin, acceso };
}

async function actualizarClub(
  formData: FormData,
  cambios: Record<string, unknown>,
  aviso: AvisoAdmin,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const contexto = await obtenerAdminActual(id);
  if ("error" in contexto) return volverConAviso("no-admin");

  await contexto.admin.from("clubs").update(cambios).eq("id", id);
  revalidatePath(RUTA_CLUBES);

  // Con aviso, como el de regalar acceso. Suspender un club le tumba la
  // página pública y le corta el panel, y hasta ahora no decía nada:
  // desde fuera, hacerlo y que fallase se veían exactamente igual.
  return volverConAviso(aviso);
}

/** Bloqueo total (Fase 12): el club pierde el acceso a su panel y desaparece de la página pública y del buscador. */
export async function suspenderClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: true, admin_suspended_at: new Date().toISOString() }, "suspendido");
}

export async function reactivarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_suspended: false, admin_suspended_at: null }, "reactivado");
}

/**
 * Modo de pruebas (migración 0053): el club desaparece de todo lo
 * público —página, buscador, /servicios, sitemap y avisos a empresas—
 * pero sigue entrando a su panel con normalidad. Es lo que se quiere
 * para el club de pruebas de la plataforma o para preparar la ficha de
 * un club invitado antes de enseñarla. Suspender, en cambio, le corta
 * también el panel.
 */
export async function activarModoPruebas(formData: FormData): Promise<void> {
  await actualizarClub(
    formData,
    { admin_test_mode: true, admin_test_mode_at: new Date().toISOString() },
    "modo-pruebas",
  );
}

export async function quitarModoPruebas(formData: FormData): Promise<void> {
  await actualizarClub(formData, { admin_test_mode: false, admin_test_mode_at: null }, "fuera-de-pruebas");
}

/** Insignia pública de "verificado" en la página del club. */
export async function verificarClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: true, verified_at: new Date().toISOString() }, "verificado");
}

export async function quitarVerificacionClub(formData: FormData): Promise<void> {
  await actualizarClub(formData, { verified: false, verified_at: null }, "sin-verificar");
}

/**
 * Regala acceso a un club invitado hasta la fecha que elija el
 * administrador.
 *
 * Por dentro es la prueba gratuita de siempre con la fecha de fin
 * movida: el club entra en el buscador, tiene su panel entero, recibe
 * el aviso antes de que se le acabe y el cron diario la cierra sola el
 * día señalado. No hace falta acordarse de nada.
 *
 * Para terminar el regalo se guarda la fecha de hoy: esa misma noche el
 * cron lo cierra. Y si el club ya paga por Stripe no se toca nada,
 * porque escribirle encima una prueba dejaría a la plataforma diciendo
 * una cosa y a Stripe cobrando otra.
 */
export async function darAccesoGratuito(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const contexto = await obtenerAdminActual(id);
  if ("error" in contexto) return volverConAviso("no-admin");

  // El plazo llega de los botones rápidos (seis meses, un año, fin de
  // temporada) y la fecha, del calendario de al lado. El botón manda:
  // si se ha pulsado uno, es lo que el administrador acaba de decidir.
  const plazo = fechaDelPlazo(String(formData.get("plazo") ?? ""));
  const hasta = plazo ?? fechaDeAccesoValida(String(formData.get("hasta") ?? ""));
  if (!id || !hasta) return volverConAviso("fecha");

  const { data: fila } = await contexto.admin
    .from("clubs")
    .select("stripe_subscription_id")
    .eq("id", id)
    .maybeSingle<{ stripe_subscription_id: string | null }>();

  // Un club que todavía no ha guardado su ficha no tiene fila en
  // `clubs` —se crea al guardar nombre y localidad, que son
  // obligatorios— y por tanto no hay dónde escribirle el acceso.
  if (!fila) return volverConAviso("sin-ficha");

  // Y a uno que ya paga no se le escribe una prueba por encima: la
  // plataforma diría una cosa y Stripe estaría cobrando otra.
  if (fila.stripe_subscription_id) return volverConAviso("paga-stripe");

  const fin = finalDelDia(hasta);

  await contexto.admin
    .from("clubs")
    .update({
      subscription_status: "trialing",
      trial_ends_at: fin,
      current_period_end: fin,
      // Los avisos de caducidad son de otra cosa (una cancelación que el
      // club programó). Se limpian para que no le llegue un recordatorio
      // que ya no viene a cuento.
      cancel_at_period_end: false,
      reminder_7d_sent_at: null,
      reminder_3d_sent_at: null,
      reminder_1d_sent_at: null,
    })
    .eq("id", id);

  revalidatePath(RUTA_CLUBES);
  return volverConAviso("regalado");
}

/**
 * Cambia el país de un club (solo el administrador): por si se equivocó
 * al registrarse. Mueve el club a la lista del representante de ese
 * país, y con él su comisión de aquí en adelante.
 */
export async function cambiarPaisClub(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const pais = formData.get("pais");
  const contexto = await obtenerAdminActual(id);
  if ("error" in contexto || contexto.acceso.tipo !== "admin" || !esPaisValido(pais)) {
    return volverConAviso("no-admin");
  }

  const { data } = await contexto.admin.auth.admin.getUserById(id);
  if (!data?.user) return volverConAviso("no-admin");

  // `app_metadata` se reescribe entero: se parte del que tiene para no
  // perder el rol, el piloto ni el origen de la campaña.
  await contexto.admin.auth.admin.updateUserById(id, {
    app_metadata: { ...data.user.app_metadata, pais },
  });
  // La ficha guarda una copia del país (migración 0060) para la moneda
  // y el buscador. Tocar la fila hace que el trigger la copie otra vez
  // de la cuenta, que ya tiene el nuevo.
  await contexto.admin.from("clubs").update({ country: pais }).eq("id", id);

  revalidatePath(RUTA_CLUBES);
  return volverConAviso("pais-cambiado");
}

/**
 * Pasa un club a la promoción de "6 meses gratis" (pedido por Rafael el
 * 5-11-2026, para el CD Maciot Sport, que se registró por la página
 * normal y le tocó 1 mes).
 *
 * Hace lo mismo que si se hubiera registrado por apoyaclub.com/6mesesgratis:
 *   - le pone la marca `piloto` en la cuenta, así ocupa una de las 20
 *     plazas de su país, el contador de la campaña lo descuenta y sale
 *     la etiqueta violeta en el listado;
 *   - le da los 6 meses contados desde que se registró, como al resto.
 *     Si ya tenía más tiempo (por ejemplo, porque se le dio "6 meses"
 *     desde hoy con el otro botón), no se le quita.
 *
 * Si no quedan plazas en su país, no hace nada y lo dice. A un club que
 * ya paga por Stripe tampoco se le toca, por lo mismo que en
 * `darAccesoGratuito`.
 */
export async function pasarASeisMesesGratis(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const contexto = await obtenerAdminActual(id);
  if ("error" in contexto) return volverConAviso("no-admin");
  const { admin } = contexto;

  const { data: cuenta } = await admin.auth.admin.getUserById(id);
  const usuario = cuenta?.user;
  if (!usuario || usuario.app_metadata?.role !== "club") return volverConAviso("no-admin");

  const { data: fila } = await admin
    .from("clubs")
    .select("stripe_subscription_id, trial_ends_at")
    .eq("id", id)
    .maybeSingle<{ stripe_subscription_id: string | null; trial_ends_at: string | null }>();
  if (!fila) return volverConAviso("sin-ficha");
  if (fila.stripe_subscription_id) return volverConAviso("paga-stripe");

  // La plaza: solo si todavía no la tiene y queda alguna en su país.
  if (!esDelPiloto(usuario.app_metadata)) {
    const libres = await plazasPilotoLibres(admin, paisDeLaCuenta(usuario.app_metadata));
    if (libres !== null && libres <= 0) return volverConAviso("sin-plazas-piloto");
    await admin.auth.admin.updateUserById(id, {
      app_metadata: { ...usuario.app_metadata, piloto: true },
    });
  }

  // Los 6 meses, desde el registro; nunca menos de lo que ya tenía.
  const desdeElRegistro = new Date(usuario.created_at);
  desdeElRegistro.setMonth(desdeElRegistro.getMonth() + MESES_PILOTO);
  const yaTenia = fila.trial_ends_at ? new Date(fila.trial_ends_at) : null;
  const fin = finalDelDia(
    (yaTenia && yaTenia > desdeElRegistro ? yaTenia : desdeElRegistro).toISOString().slice(0, 10),
  );

  await admin
    .from("clubs")
    .update({
      subscription_status: "trialing",
      trial_ends_at: fin,
      current_period_end: fin,
      cancel_at_period_end: false,
      reminder_7d_sent_at: null,
      reminder_3d_sent_at: null,
      reminder_1d_sent_at: null,
    })
    .eq("id", id);

  revalidatePath(RUTA_CLUBES);
  return volverConAviso("pasado-a-seis-meses");
}
