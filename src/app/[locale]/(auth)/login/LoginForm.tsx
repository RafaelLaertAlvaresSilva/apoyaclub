"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { iniciarSesion } from "./actions";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tComun = useTranslations("auth.comun");
  const searchParams = useSearchParams();

  // Los avisos que llegan por la URL después de verificar el correo o
  // cambiar la contraseña.
  const MENSAJES_EXITO: Record<string, string> = {
    "password-actualizada": t("passwordActualizada"),
    "email-verificado": t("emailVerificado"),
  };

  // Avisos que llegan cuando la web ha tenido que devolver a alguien
  // aquí, para que no se quede mirando el formulario sin saber por qué.
  const MENSAJES_MOTIVO: Record<string, string> = {
    "sesion-sin-rol": t("sesionSinRol"),
  };

  const next = searchParams.get("next");
  const mensajeExito = searchParams.get("mensaje");
  const motivo = searchParams.get("motivo");

  const [estado, formAction] = useActionState(iniciarSesion, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitulo")}</p>
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

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
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {/* Debajo del campo y no al lado de su etiqueta: aquí es donde
              se mira cuando la contraseña no entra. */}
          <div className="mt-1.5">
            <Link
              href="/recuperar-password"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              {t("olvidadaLarga")}
            </Link>
          </div>
        </div>

        {mensajeExito && <AvisoExito mensaje={MENSAJES_EXITO[mensajeExito]} />}
        {motivo && MENSAJES_MOTIVO[motivo] && <AvisoError mensaje={MENSAJES_MOTIVO[motivo]} />}
        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>{t("boton")}</BotonEnviar>
      </form>

      <div className="space-y-1 text-center text-sm text-zinc-500">
        <p>{t("sinCuenta")}</p>
        <div className="flex justify-center gap-4">
          <Link href="/registro-club" className="font-medium text-teal-700 hover:underline">
            {t("registrarClub")}
          </Link>
        </div>
        <p className="text-xs text-zinc-400">
          ¿Eres una empresa? No necesitas cuenta: entra en la ficha de cualquier club y escríbele
          desde ahí.
        </p>
      </div>
    </div>
  );
}
