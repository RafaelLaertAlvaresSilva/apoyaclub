import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Favorito } from "@/lib/favoritos";
import type { Role } from "@/lib/types";

/**
 * Qué tiene guardado quien está mirando, y si tiene cuenta.
 *
 * Lo pregunta el navegador al cargar la página, en vez de calcularlo en
 * el servidor al pintarla: la ficha del club y el buscador se guardan
 * en caché unos segundos para que vayan rápidos, y mirar la sesión al
 * pintarlas acabaría con esa caché. Un botón de favorito no puede
 * costar eso.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esEmpresa = !!user && (user.app_metadata?.role as Role | undefined) === "empresa";

  if (!esEmpresa) {
    return NextResponse.json({ conCuenta: false, favoritos: [] as Favorito[] });
  }

  const { data } = await supabase
    .from("company_favorites")
    .select("club_id, opportunity_id")
    .eq("company_id", user.id)
    .returns<{ club_id: string | null; opportunity_id: string | null }[]>();

  const favoritos: Favorito[] = (data ?? []).map((fila) =>
    fila.club_id
      ? { tipo: "club" as const, id: fila.club_id }
      : { tipo: "oportunidad" as const, id: fila.opportunity_id! },
  );

  return NextResponse.json({ conCuenta: true, favoritos });
}
