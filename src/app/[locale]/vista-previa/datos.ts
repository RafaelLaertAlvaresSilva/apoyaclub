import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { obtenerClubPublico, obtenerClubVistaPrevia, type ClubPublico } from "../club/[slug]/data";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type VistaPrevia = {
  datos: ClubPublico;
  /** Si la ficha se ve en público ahora mismo (si no, solo la ve el club). */
  esPublica: boolean;
};

/**
 * La ficha del club que tiene la sesión abierta, para su vista previa.
 *
 * Siempre la SUYA: el club sale de la sesión y no de la dirección, así
 * que nadie puede mirar la ficha escondida de otro club cambiando la URL.
 * Sin sesión de club, al acceso; sin ficha creada todavía, a su panel.
 */
export async function vistaPreviaDelClub(): Promise<VistaPrevia> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return redirect({ href: "/login", locale });
  }

  const datos = await obtenerClubVistaPrevia(user.id);
  if (!datos) return redirect({ href: "/panel", locale });

  const esPublica = (await obtenerClubPublico(datos.perfil.slug)) !== null;
  return { datos, esPublica };
}
