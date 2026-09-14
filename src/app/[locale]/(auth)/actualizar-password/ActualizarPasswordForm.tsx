"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CampoContrasena } from "@/components/CampoContrasena";
import { actualizarPassword } from "./actions";

export function ActualizarPasswordForm() {
  const t = useTranslations("auth.actualizarPassword");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(actualizarPassword, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t("titulo")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("subtitulo")}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <CampoContrasena
          id="password"
          name="password"
          etiqueta={t("nueva")}
          autoComplete="new-password"
          minLength={8}
          ayuda={tComun("minimoCaracteres")}
        />

        <CampoContrasena
          id="confirmarPassword"
          name="confirmarPassword"
          etiqueta={t("confirmarNueva")}
          autoComplete="new-password"
        />

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>
    </div>
  );
}
