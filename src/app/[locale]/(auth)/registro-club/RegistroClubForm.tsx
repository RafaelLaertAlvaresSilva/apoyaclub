"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { CLASES_CAMPO_ACCESO, CampoContrasena } from "@/components/CampoContrasena";
import { registrarClub } from "./actions";

export function RegistroClubForm() {
  const t = useTranslations("auth.registroClub");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(registrarClub, null);

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
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("nombre")}
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="organization"
            className={CLASES_CAMPO_ACCESO}
          />
        </div>

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

        <CampoContrasena
          id="password"
          name="password"
          etiqueta={tComun("password")}
          autoComplete="new-password"
          minLength={8}
          ayuda={tComun("minimoCaracteres")}
        />

        <CampoContrasena
          id="confirmarPassword"
          name="confirmarPassword"
          etiqueta={tComun("confirmarPassword")}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            name="aceptaTerminos"
            required
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
          <span>
            {tComun("aceptoParte1")}{" "}
            <Link href="/condiciones-de-uso" target="_blank" className="font-medium text-teal-700 hover:underline">
              {tComun("condiciones")}
            </Link>{" "}
            {tComun("aceptoParte2")}{" "}
            <Link href="/privacidad" target="_blank" className="font-medium text-teal-700 hover:underline">
              {tComun("privacidad")}
            </Link>
            .
          </span>
        </label>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>

      <div className="space-y-2 text-center text-sm text-zinc-500">
        <p>
          {tComun("yaTienesCuenta")}{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            {tComun("iniciaSesion")}
          </Link>
        </p>
      </div>
    </div>
  );
}
