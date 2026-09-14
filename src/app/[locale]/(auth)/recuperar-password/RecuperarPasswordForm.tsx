"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CLASES_CAMPO_ACCESO } from "@/components/CampoContrasena";
import { solicitarRecuperacion } from "./actions";

export function RecuperarPasswordForm() {
  const t = useTranslations("auth.recuperar");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(solicitarRecuperacion, null);

  if (estado?.enviado) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("enviadoTitulo")}</h1>
        <p className="text-sm text-zinc-500">
          {t("enviadoTexto")}
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-teal-700 hover:underline">
          {tComun("volverALogin")}
        </Link>
      </div>
    );
  }

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
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            {tComun("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>

      <div className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          {tComun("volverALogin")}
        </Link>
      </div>
    </div>
  );
}
