"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("panel.privacidad");
  const [estado, formAction] = useActionState(eliminarCuentaClub, null);

  return (
    <form action={formAction} className="space-y-4">
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
        <li>{t("seCancelaDeInmediato")}</li>
        <li>{t("seBorranTuPerfil")}</li>
        <li>{t("seBorranTusSolicitudes")}</li>
        <li>{t("tuPaginaPublicaDeja")}</li>
      </ul>

      <div>
        <label htmlFor="confirmacion" className="mb-1 block text-sm font-medium text-zinc-700">{t("escribeEliminarParaConfirmar")}</label>
        <input
          id="confirmacion"
          name="confirmacion"
          type="text"
          required
          autoComplete="off"
          placeholder={t("eliminar")}
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <AvisoError mensaje={estado?.error} />

      <BotonEliminar />
    </form>
  );
}
