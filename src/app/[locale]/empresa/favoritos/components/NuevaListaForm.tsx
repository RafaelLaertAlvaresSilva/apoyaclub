"use client";

import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { crearListaFavoritos } from "../actions";

export function NuevaListaForm() {
  const [estado, formAction] = useActionState(crearListaFavoritos, null);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          placeholder="Nombre de la nueva lista (ej. Fútbol base Madrid)"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:flex-1"
        />
        <div className="sm:w-40">
          <BotonEnviar>+ Nueva lista</BotonEnviar>
        </div>
      </div>
      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
    </form>
  );
}
