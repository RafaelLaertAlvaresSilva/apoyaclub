import { BarraLogo } from "@/components/BarraLogo";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { accesoAdminDe } from "@/lib/acceso-admin";

/**
 * El middleware ya restringe `/admin` al rol "admin" (Fase 12); este
 * layout repite la comprobación como segunda capa, dado lo sensible
 * que es este panel (ve datos de todos los clubes y empresas, y puede
 * suspenderlos o verificarlos). Cada Server Action de `/admin` también
 * se comprueba a sí misma, igual que en `/panel` — así el acceso no
 * depende solo de ocultar el enlace en la interfaz.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Administrador o representante. Lo que ve cada uno lo recorta cada
  // página con `accesoAdminDeLaPagina`.
  if (!accesoAdminDe(user)) {
    const locale = await getLocale();
    // Un representante al que se le ha quitado el acceso: al login
    // volvería aquí (su rol sigue siendo ese) y daría vueltas sin fin.
    if (user?.app_metadata?.role === "representante") {
      return redirect({ href: "/cuenta-suspendida", locale });
    }
    return redirect({ href: "/login", locale });
  }

  return (
    <>
      <BarraLogo />
      {children}
    </>
  );
}
