import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActualizarPasswordForm } from "./ActualizarPasswordForm";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default async function ActualizarPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Enlace no válido
        </h1>
        <p className="text-sm text-zinc-500">
          El enlace ha caducado o ya se ha utilizado. Solicita uno nuevo para
          restablecer tu contraseña.
        </p>
        <Link
          href="/recuperar-password"
          className="inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return <ActualizarPasswordForm />;
}
