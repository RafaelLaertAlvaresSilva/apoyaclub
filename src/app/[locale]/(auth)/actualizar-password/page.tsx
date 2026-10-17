import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActualizarPasswordForm } from "./ActualizarPasswordForm";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tMetadatos = await getTranslations("auth.titulos");
  return { title: tMetadatos("nuevaContrasena") };
}

export default async function ActualizarPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const t = await getTranslations("auth.actualizarPassword");
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t("enlaceNoValido")}
        </h1>
        <p className="text-sm text-zinc-500">
          {t("enlaceCaducado")}
        </p>
        <Link
          href="/recuperar-password"
          className="inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          {t("solicitarNuevo")}
        </Link>
      </div>
    );
  }

  return <ActualizarPasswordForm />;
}
