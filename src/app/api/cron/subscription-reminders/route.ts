import { NextResponse } from "next/server";
import { enviarEmailAvisoCaducidadSuscripcion } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron diario (Fase 10, ver `vercel.json`) que avisa por email a los
 * clubes que han cancelado su suscripción, 7, 3 y 1 día antes de que
 * pierdan el acceso (`current_period_end`). Solo se avisa de
 * cancelaciones programadas por el club (`cancel_at_period_end`): es la
 * única fecha de caducidad que se conoce con certeza de antemano; un
 * cobro fallido ya se refleja como estado "impagada" en el panel sin
 * una fecha de caducidad fija.
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
    console.error("[cron avisos suscripción] No se han podido leer los clubes:", error);
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
      panelUrl: `${SITE_URL}/panel/suscripcion`,
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

  return NextResponse.json({ revisados: clubes?.length ?? 0, enviados });
}
