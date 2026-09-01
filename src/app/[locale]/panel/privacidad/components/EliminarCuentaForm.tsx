"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AvisoError } from "@/components/AvisoError";
import { eliminarCuentaClub } from "../actions";

function BotonEliminar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {pending ? "Eliminando…" : "Eliminar mi cuenta y todos mis datos"}
    </button>
  );
}

/** Formulario de baja definitiva del club (Fase 11). Ver `eliminarCuentaClub`. */
export function EliminarCuentaForm() {
  const [estado, formAction] = useActionState(eliminarCuentaClub, null);

  return (
    <form action={formAction} className="space-y-4">
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
        <li>Se cancela de inmediato cualquier suscripción activa en Stripe.</li>
        <li>Se borran tu perfil, equipos, patrocinadores, oportunidades, logo y fotos.</li>
        <li>Se borran tus solicitudes de contacto y tu dossier comercial.</li>
        <li>Tu página pública deja de existir. Esta acción no se puede deshacer.</li>
      </ul>

      <div>
        <label htmlFor="confirmacion" className="mb-1 block text-sm font-medium text-zinc-700">
          Escribe ELIMINAR para confirmar
        </label>
        <input
          id="confirmacion"
          name="confirmacion"
          type="text"
          required
          autoComplete="off"
          placeholder="ELIMINAR"
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <AvisoError mensaje={estado?.error} />

      <BotonEliminar />
    </form>
  );
}
