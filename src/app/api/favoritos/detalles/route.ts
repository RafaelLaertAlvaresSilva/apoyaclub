import { NextResponse } from "next/server";
import { limpiar } from "@/lib/favoritos";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Los datos de lo que alguien tiene guardado.
 *
 * En el navegador solo se guardan identificadores, así que la página de
 * guardados no puede enseñar nada sin pedir aquí los nombres. Lee de
 * las vistas públicas: un identificador guardado no da acceso a nada
 * que no estuviera ya publicado, y si el club se dio de baja
 * simplemente deja de salir.
 */

type FilaClub = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  province: string | null;
  logo_url: string | null;
};

type FilaOportunidad = {
  opportunity_id: string;
  title: string;
  club_slug: string;
  club_name: string;
  is_need: boolean | null;
};

export async function POST(request: Request) {
  let favoritos;

  try {
    const cuerpo = (await request.json()) as { favoritos?: unknown };
    favoritos = limpiar(cuerpo.favoritos);
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const idsClub = favoritos.filter((f) => f.tipo === "club").map((f) => f.id);
  const idsOportunidad = favoritos.filter((f) => f.tipo === "oportunidad").map((f) => f.id);

  const supabase = createPublicClient();

  const [clubes, oportunidades] = await Promise.all([
    idsClub.length
      ? supabase
          .from("club_public_profiles")
          .select("id, slug, name, city, province, logo_url")
          .in("id", idsClub)
          .returns<FilaClub[]>()
      : Promise.resolve({ data: [] as FilaClub[] }),
    idsOportunidad.length
      ? supabase
          .from("opportunity_search_view")
          .select("opportunity_id, title, club_slug, club_name, is_need")
          .in("opportunity_id", idsOportunidad)
          .returns<FilaOportunidad[]>()
      : Promise.resolve({ data: [] as FilaOportunidad[] }),
  ]);

  return NextResponse.json({
    clubes: (clubes.data ?? []).map((fila) => ({
      id: fila.id,
      slug: fila.slug,
      nombre: fila.name,
      donde: [fila.city, fila.province].filter(Boolean).join(", "),
      logoUrl: fila.logo_url,
    })),
    oportunidades: (oportunidades.data ?? []).map((fila) => ({
      id: fila.opportunity_id,
      titulo: fila.title,
      clubSlug: fila.club_slug,
      clubNombre: fila.club_name,
      esNecesidad: fila.is_need ?? false,
    })),
  });
}
