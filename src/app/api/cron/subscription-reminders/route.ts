import { avisarDeFallo } from "@/lib/monitoring";
import { NextResponse } from "next/server";
import { enviarEmailAvisoCaducidadSuscripcion } from "@/lib/email/resend";
import {
  avisarFinDePrueba,
  cerrarPruebasVencidas,
  enviarBienvenidas,
  recordarFichaIncompleta,
  recordarSolicitudesSinAbrir,
} from "@/lib/emails-ciclo";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron diario (ver `vercel.json`) de todos los avisos por email.
 *
 * 1. Caducidad tras cancelar (Fase 10): 7, 3 y 1 día antes de perder el
 *    acceso (`current_period_end`). Solo para cancelaciones programadas
 *    por el club (`cancel_at_period_end`): es la única fecha de
 *    caducidad que se conoce de antemano; un cobro fallido ya se refleja
 *    como "impagada" en el panel sin fecha fija.
 * 2. Bienvenida a quien acaba de confirmar su cuenta.
 * 3. Fin del mes gratis, antes del primer cobro.
 * 4. Solicitudes que el club lleva 48 horas sin abrir.
 * 5. Ficha a medias: una sola vez, a los diez días del alta, si sigue
 *    por debajo del umbral que le resta visibilidad en el buscador.
 *
 * Los tres últimos viven en `lib/emails-ciclo.ts`. Cada bloque va por su
 * cuenta: si uno falla, los demás se envían igual.
 *
 * Protegido con `CRON_SECRET` (ver `.env.local.example`): Vercel Cron
 * llama a esta URL con la cabecera `Authorization: Bearer $CRON_SECRET`
 * cuando esa variable está configurada en el proyecto de Vercel.
 */

type FilaRecordatorio = {
  id: string;
  name: string;
  current_period_end: string | null;
  reminder_7d_sent_at: string | null;
  reminder_3d_sent_at: string | null;
  reminder_1d_sent_at: string | null;
};

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  const autorizacion = request.headers.get("authorization");

  if (!secreto || autorizacion !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: clubes, error } = await admin
    .from("clubs")
    .select("id, name, current_period_end, reminder_7d_sent_at, reminder_3d_sent_at, reminder_1d_sent_at")
    .eq("cancel_at_period_end", true)
    .not("current_period_end", "is", null)
    .returns<FilaRecordatorio[]>();

  if (error) {
    avisarDeFallo("cron-suscripciones", "No se han podido leer los clubes", error);
    return NextResponse.json({ error: "No se han podido leer los clubes." }, { status: 500 });
  }

  const ahora = Date.now();
  let enviados = 0;

  for (const club of clubes ?? []) {
    if (!club.current_period_end) continue;

    const finPeriodo = new Date(club.current_period_end).getTime();
    const diasRestantes = Math.ceil((finPeriodo - ahora) / (1000 * 60 * 60 * 24));

    // Ya ha caducado (o caduca hoy mismo, sin margen): el webhook
    // `customer.subscription.deleted` se encargará de marcarla como
    // cancelada; aquí no hay nada más que avisar.
    if (diasRestantes < 1) continue;

    // Se manda como mucho un aviso por ejecución del cron, el más
    // urgente que todavía no se haya enviado (de 1 a 7 días).
    let umbral: 1 | 3 | 7 | null = null;
    let columna: "reminder_1d_sent_at" | "reminder_3d_sent_at" | "reminder_7d_sent_at" | null = null;

    if (diasRestantes <= 1 && !club.reminder_1d_sent_at) {
      umbral = 1;
      columna = "reminder_1d_sent_at";
    } else if (diasRestantes <= 3 && !club.reminder_3d_sent_at) {
      umbral = 3;
      columna = "reminder_3d_sent_at";
    } else if (diasRestantes <= 7 && !club.reminder_7d_sent_at) {
      umbral = 7;
      columna = "reminder_7d_sent_at";
    }

    if (!umbral || !columna) continue;

    const { data: usuario } = await admin.auth.admin.getUserById(club.id);
    const email = usuario.user?.email;
    if (!email) continue;

    const resultado = await enviarEmailAvisoCaducidadSuscripcion({
      clubEmail: email,
      clubName: club.name,
      diasRestantes: umbral,
      fechaFin: new Date(club.current_period_end).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      panelUrl: `${SITE_URL}/${routing.defaultLocale}/panel/suscripcion`,
    });

    // Se marca como enviado tanto si Resend confirma el envío como si
    // no está configurado (mismo criterio que el resto de la
    // plataforma, Fase 8): lo importante es no reintentarlo cada día.
    if (resultado.ok || resultado.error === "Envío de email no configurado todavía.") {
      await admin
        .from("clubs")
        .update({ [columna]: new Date().toISOString() })
        .eq("id", club.id);
    }

    if (resultado.ok) enviados += 1;
  }

  // Los tres avisos de la migración 0013. Cada uno atrapa sus propios
  // errores y devuelve cuántos emails ha mandado, así que un fallo en
  // uno no deja a los otros sin enviarse.
  const [bienvenidas, finDePrueba, sinAbrir, pruebasCerradas, fichasIncompletas] = await Promise.all([
    enviarBienvenidas(admin).catch((excepcion) => {
      avisarDeFallo("cron-suscripciones", "Fallo enviando las bienvenidas", excepcion);
      return 0;
    }),
    avisarFinDePrueba(admin).catch((excepcion) => {
      avisarDeFallo("cron-suscripciones", "Fallo avisando del fin de la prueba", excepcion);
      return 0;
    }),
    recordarSolicitudesSinAbrir(admin).catch((excepcion) => {
      avisarDeFallo("cron-suscripciones", "Fallo recordando las solicitudes sin abrir", excepcion);
      return 0;
    }),
    cerrarPruebasVencidas(admin).catch((excepcion) => {
      avisarDeFallo("cron-suscripciones", "Fallo cerrando las pruebas vencidas", excepcion);
      return 0;
    }),
    recordarFichaIncompleta(admin).catch((excepcion) => {
      avisarDeFallo("cron-suscripciones", "Fallo recordando las fichas incompletas", excepcion);
      return 0;
    }),
  ]);

  return NextResponse.json({
    revisados: clubes?.length ?? 0,
    caducidad: enviados,
    bienvenidas,
    finDePrueba,
    sinAbrir,
    pruebasCerradas,
    fichasIncompletas,
  });
}
