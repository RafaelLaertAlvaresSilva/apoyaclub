import { NextResponse } from "next/server";
import { consumirLimite, ipDelVisitante } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registra una visita a la página pública de un club (migración 0014).
 *
 * Va por aquí y no dentro de la propia página porque `/club/[slug]` se
 * sirve cacheada (`revalidate = 60`): contar dentro del render daría
 * cifras a ojo. La llama un componente de cliente al abrirse la página.
 *
 * No se guarda ni IP ni identificador de usuario: solo el club y la
 * fecha. La IP se usa únicamente para deduplicar (una visita por club,
 * IP y hora), reutilizando el limitador que ya existe.
 */
export async function POST(request: Request) {
  let slug: string;

  try {
    const cuerpo = (await request.json()) as { slug?: unknown };
    slug = String(cuerpo.slug ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!slug || slug.length > 120) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = await ipDelVisitante();
  const esVisitaNueva = await consumirLimite({
    bucket: `visita-club:${slug}`,
    identificador: ip,
    limite: 1,
    ventanaSegundos: 3600,
  });

  // Recargar la página o volver atrás no cuenta como visita nueva.
  if (!esVisitaNueva) return NextResponse.json({ ok: true, contada: false });

  try {
    const admin = createAdminClient();
    const { data: club } = await admin
      .from("clubs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle<{ id: string }>();

    if (!club) return NextResponse.json({ ok: false }, { status: 404 });

    await admin.from("club_page_views").insert({ club_id: club.id });
  } catch {
    // La métrica nunca puede romper la página que la dispara.
    return NextResponse.json({ ok: true, contada: false });
  }

  return NextResponse.json({ ok: true, contada: true });
}
