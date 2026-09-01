"use client";

import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { actualizarPassword } from "./actions";

export function ActualizarPasswordForm() {
  const [estado, formAction] = useActionState(actualizarPassword, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">
          Crea una nueva contraseña
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-zinc-400">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label htmlFor="confirmarPassword" className="mb-1 block text-sm font-medium text-zinc-700">
            Confirma la nueva contraseña
          </label>
          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <AvisoError mensaje={estado?.error} />

        <BotonEnviar>Guardar nueva contraseña</BotonEnviar>
      </form>
    </div>
  );
}
