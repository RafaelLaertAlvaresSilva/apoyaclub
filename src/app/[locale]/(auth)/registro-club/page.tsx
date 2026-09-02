"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { registrarClub } from "./actions";

export default function RegistroClubPage() {
  const t = useTranslations("auth.registroClub");
  const tComun = useTranslations("auth.comun");
  const [estado, formAction] = useActionState(registrarClub, null);

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
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-zinc-700">
            {t("nombre")}
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="organization"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            {tComun("password")}
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
            {tComun("confirmarPassword")}
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
          {t("eresEmpresa")}{" "}
          <Link href="/registro-empresa" className="font-medium text-teal-700 hover:underline">
            {t("registrateAqui")}
          </Link>
        </p>
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
