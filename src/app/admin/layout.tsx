import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

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

  const rol = user?.app_metadata?.role as Role | undefined;
  if (!user || rol !== "admin") {
    redirect("/login");
  }

  return <>{children}</>;
}
