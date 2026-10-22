import { BarraLogo } from "@/components/BarraLogo";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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

  // Modo de pruebas (migración 0055): la empresa usa su panel, pero no
  // sale en el directorio. Se le dice arriba para que no piense que su
  // ficha se ha roto. `*` para no fallar si la migración aún no está.
  const { data: fila } = await supabase
    .from("companies")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<{ admin_test_mode?: boolean | null }>();
  const t = await getTranslations("empresa.panel");

  return (
    <>
      <BarraLogo />
      {fila?.admin_test_mode && (
        <div role="status" className="bg-aviso px-4 py-2.5 text-center text-sm font-medium text-sobre-aviso">
          {t("avisoModoPruebas")}
        </div>
      )}
      {children}
    </>
  );
}
