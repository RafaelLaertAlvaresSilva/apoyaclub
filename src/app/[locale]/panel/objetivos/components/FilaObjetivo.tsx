"use client";

import {
  CLASES_ESTADO,
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_ORIGEN,
  estaAbierto,
  fechaDelPaso,
  type Prospecto,
} from "@/lib/prospectos";
import { borrarObjetivo, cambiarEstadoObjetivo, cambiarProximoPaso } from "../actions";

/** Una empresa de la lista, con lo que el club hace con ella. */
export function FilaObjetivo({ prospecto, hoy }: { prospecto: Prospecto; hoy: string }) {
  const toca =
    estaAbierto(prospecto) && prospecto.proximoPaso !== null && prospecto.proximoPaso <= hoy;

  return (
    <li
      className={`rounded-xl border bg-white p-4 ${
        toca ? "border-amber-300 ring-1 ring-amber-100" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-900">{prospecto.nombre}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO[prospecto.estado]}`}
            >
              {ETIQUETA_ESTADO[prospecto.estado]}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-zinc-500">
            {ETIQUETA_ORIGEN[prospecto.origen]}
            {prospecto.sector ? ` · ${prospecto.sector}` : ""}
          </p>

          {(prospecto.contactoNombre || prospecto.contactoDatos) && (
            <p className="mt-1.5 text-sm text-zinc-700">
              {prospecto.contactoNombre}
              {prospecto.contactoNombre && prospecto.contactoDatos ? " · " : ""}
              {prospecto.contactoDatos}
            </p>
          )}

          {prospecto.notas && (
            <p className="mt-1.5 whitespace-pre-line text-sm text-zinc-600">{prospecto.notas}</p>
          )}
        </div>

        <form action={borrarObjetivo}>
          <input type="hidden" name="id" value={prospecto.id} />
          <button
            type="submit"
            className="text-xs text-zinc-400 transition-colors hover:text-red-600"
          >
            Borrar
          </button>
        </form>
      </div>

      {/* Volver a llamar. Es la mitad del trabajo: la mayoría de los
          patrocinios no se pierden por un no, se pierden por no volver. */}
      <form action={cambiarProximoPaso} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={prospecto.id} />
        <label htmlFor={`paso-${prospecto.id}`} className="text-xs text-zinc-500">
          Volver a llamar el
        </label>
        <input
          id={`paso-${prospecto.id}`}
          type="date"
          name="proximoPaso"
          defaultValue={prospecto.proximoPaso ?? ""}
          className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Guardar
        </button>
        {toca && prospecto.proximoPaso && (
          <span className="text-xs font-medium text-amber-700">
            Toca hoy — era el {fechaDelPaso(prospecto.proximoPaso)}
          </span>
        )}
      </form>

      <div className="mt-3 flex flex-wrap gap-1">
        {ESTADOS.filter((estado) => estado.id !== prospecto.estado).map((estado) => (
          <form key={estado.id} action={cambiarEstadoObjetivo}>
            <input type="hidden" name="id" value={prospecto.id} />
            <input type="hidden" name="estado" value={estado.id} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-500 hover:text-teal-700"
            >
              {estado.etiqueta}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
