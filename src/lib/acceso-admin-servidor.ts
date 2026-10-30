import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { accesoAdminDe, type AccesoAdmin } from "@/lib/acceso-admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Para las páginas del admin: quién entra y qué puede ver. Sin acceso,
 * al login.
 *
 * El middleware ya deja pasar solo a administradores y representantes;
 * esto es la segunda capa, y la que recorta: cada página decide con el
 * `acceso` que devuelve qué enseña.
 */
export async function accesoAdminDeLaPagina(): Promise<AccesoAdmin> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const acceso = accesoAdminDe(user);
  if (!acceso) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }
  return acceso;
}

/**
 * Para las páginas que son solo del administrador (resumen, empresas,
 * finanzas, bajas, representantes): un representante que llegue
 * escribiendo la dirección va a su lista de clubes.
 */
export async function soloAdministrador(): Promise<void> {
  const acceso = await accesoAdminDeLaPagina();
  if (acceso.tipo !== "admin") {
    const locale = await getLocale();
    redirect({ href: "/admin/clubes", locale });
  }
}

/** Para las Server Actions: el acceso, o null si la sesión no vale. */
export async function accesoAdminDeLaAccion(): Promise<AccesoAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return accesoAdminDe(user);
}
