import { BarraLogo } from "@/components/BarraLogo";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * El panel de la empresa (migración 0046).
 *
 * El middleware ya restringe `/empresa` al rol "empresa"; este layout
 * repite la comprobación como segunda capa, igual que hace `/admin`.
 * Cada Server Action se comprueba además a sí misma: el acceso no
 * depende de ocultar un enlace.
 */
export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rol = user?.app_metadata?.role as Role | undefined;
  if (!user || rol !== "empresa") {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  return (
    <>
      <BarraLogo />
      {children}
    </>
  );
}
