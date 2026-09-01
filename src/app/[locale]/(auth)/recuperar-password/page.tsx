"use client";

import { Link } from "@/i18n/navigation";
import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { solicitarRecuperacion } from "./actions";

export default function RecuperarPasswordPage() {
  const [estado, formAction] = useActionState(solicitarRecuperacion, null);

  if (estado?.enviado) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Revisa tu correo</h1>
        <p className="text-sm text-zinc-500">
          Si existe una cuenta con ese correo electrónico, te hemos enviado un
          enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-emerald-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          Recupera tu contraseña
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>Enviar enlace</BotonEnviar>
      </form>

      <div className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
