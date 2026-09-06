"use client";

import { useActionState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { fechaCorta, type Partido } from "@/lib/publico-partidos";
import { borrarPartido } from "../actions";

const formatoNumero = new Intl.NumberFormat("es-ES");

export function PartidoFila({ partido }: { partido: Partido }) {
  const [estadoBorrado, borrar] = useActionState(borrarPartido, null);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
      <span className="w-20 flex-none text-sm tabular-nums text-zinc-500">
        {fechaCorta(partido.fecha)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">
          {partido.enCasa ? "vs" : "en"} {partido.rival}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {[
            partido.enCasa ? "En casa" : "Fuera",
            partido.equipo,
            partido.competicion,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span className="flex-none text-right">
        <span className="block text-base font-semibold tabular-nums text-zinc-900">
          {formatoNumero.format(partido.publico)}
        </span>
        <span className="block text-[11px] text-zinc-500">personas</span>
      </span>

      <form action={borrar} className="flex-none">
        <input type="hidden" name="id" value={partido.id} />
        <button
          type="submit"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          Borrar
        </button>
      </form>

      {estadoBorrado?.error && (
        <div className="w-full">
          <AvisoError mensaje={estadoBorrado.error} />
        </div>
      )}
    </li>
  );
}
