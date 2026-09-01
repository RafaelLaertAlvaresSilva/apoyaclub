"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { iniciarSesion } from "./actions";

const MENSAJES_EXITO: Record<string, string> = {
  "password-actualizada": "Tu contraseña se ha actualizado. Ya puedes iniciar sesión.",
  "email-verificado": "Tu correo se ha verificado. Ya puedes iniciar sesión.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const mensajeExito = searchParams.get("mensaje");

  const [estado, formAction] = useActionState(iniciarSesion, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Accede a tu cuenta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Introduce tus datos para entrar en ApoyaClub.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Correo electrónico
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
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Contraseña
            </label>
            <Link href="/recuperar-password" className="text-xs font-medium text-teal-700 hover:underline">
              ¿La has olvidado?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {mensajeExito && <AvisoExito mensaje={MENSAJES_EXITO[mensajeExito]} />}
        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>Iniciar sesión</BotonEnviar>
      </form>

      <div className="space-y-1 text-center text-sm text-zinc-500">
        <p>¿Todavía no tienes cuenta?</p>
        <div className="flex justify-center gap-4">
          <Link href="/registro-club" className="font-medium text-teal-700 hover:underline">
            Registrar mi club
          </Link>
          <Link href="/registro-empresa" className="font-medium text-teal-700 hover:underline">
            Registrar mi empresa
          </Link>
        </div>
      </div>
    </div>
  );
}
