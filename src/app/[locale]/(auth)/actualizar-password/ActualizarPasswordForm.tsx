"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { actualizarPassword } from "./actions";

export function ActualizarPasswordForm() {
  const t = useTranslations("auth.actualizarPassword");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(actualizarPassword, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          {t("titulo")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("subtitulo")}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("nueva")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="mt-1 text-xs text-zinc-400">{tComun("minimoCaracteres")}</p>
        </div>

        <div>
          <label htmlFor="confirmarPassword" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("confirmarNueva")}
          </label>
          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>
    </div>
  );
}
