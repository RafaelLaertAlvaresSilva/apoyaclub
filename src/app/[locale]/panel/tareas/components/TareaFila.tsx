"use client";

import { useActionState, useState } from "react";
import { AvisoError } from "@/components/AvisoError";
import {
  CLASES_ESTADO,
  ETIQUETA_ESTADO,
  cuantoFalta,
  estadoVisible,
  fechaLegible,
  type TareaPatrocinio,
} from "@/lib/tareas-patrocinio";
import { borrarTarea, cambiarEstadoTarea, repetirTarea } from "../actions";

/**
 * Una tarea de la lista, con sus botones.
 *
 * Marcar hecho es un botón y no una casilla a propósito: una casilla se
 * marca sin querer al desplazarse con el dedo, y aquí lo que se está
 * afirmando es "esto se ha cumplido", que es justo lo que el club le va
 * a enseñar al patrocinador en junio.
 */
export function TareaFila({ tarea, hoy }: { tarea: TareaPatrocinio; hoy: string }) {
  const [estadoCambio, cambiarEstado] = useActionState(cambiarEstadoTarea, null);
  const [estadoBorrado, borrar] = useActionState(borrarTarea, null);
  const [estadoRepetir, repetir] = useActionState(repetirTarea, null);
  const [pidiendoPrueba, setPidiendoPrueba] = useState(false);

  const estado = estadoVisible(tarea, hoy);
  const cerrada = tarea.estado !== "pendiente";
  const error = estadoCambio?.error ?? estadoBorrado?.error ?? estadoRepetir?.error ?? null;

  return (
    <li
      className={`rounded-lg border p-4 ${
        estado === "caducada" ? "border-red-200 bg-red-50/40" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${cerrada ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
            {tarea.accion}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {tarea.inicio && <>Del {fechaLegible(tarea.inicio)} al </>}
            {!tarea.inicio && <>Para el </>}
            {fechaLegible(tarea.fin)}
            {tarea.estado === "pendiente" && <> · {cuantoFalta(tarea.fin, hoy)}</>}
            {tarea.hechaEn && <> · hecho</>}
          </p>

          {tarea.notas && <p className="mt-2 text-sm text-zinc-600">{tarea.notas}</p>}

          {tarea.pruebaUrl && (
            <a
              href={tarea.pruebaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block break-all text-xs font-medium text-teal-700 hover:underline"
            >
              Ver la prueba →
            </a>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${CLASES_ESTADO[estado]}`}
        >
          {ETIQUETA_ESTADO[estado]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        {tarea.estado === "pendiente" ? (
          <>
            <button
              type="button"
              onClick={() => setPidiendoPrueba(true)}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
            >
              Marcar hecho
            </button>
            <Boton accion={cambiarEstado} id={tarea.id} estado="cancelado">
              Cancelar
            </Boton>
          </>
        ) : (
          <Boton accion={cambiarEstado} id={tarea.id} estado="pendiente">
            Volver a pendiente
          </Boton>
        )}

        <form action={repetir}>
          <input type="hidden" name="id" value={tarea.id} />
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            title="Crea una copia con la fecha un mes más adelante"
          >
            Repetir el mes que viene
          </button>
        </form>

        <form action={borrar} className="ml-auto">
          <input type="hidden" name="id" value={tarea.id} />
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            Borrar
          </button>
        </form>
      </div>

      {/* Al marcar hecho se pide el enlace de la prueba, pero no se
          obliga: si el club no lo tiene a mano ahora, puede cerrar la
          tarea igual y pegarlo después. Obligar aquí solo conseguiría
          que dejara de marcar nada. */}
      {pidiendoPrueba && tarea.estado === "pendiente" && (
        <form action={cambiarEstado} className="mt-3 rounded-lg bg-teal-50 p-3">
          <input type="hidden" name="id" value={tarea.id} />
          <input type="hidden" name="estado" value="hecho" />
          <label className="block text-xs font-medium text-zinc-700">
            Enlace de la prueba (opcional)
            <input
              name="pruebaUrl"
              type="url"
              placeholder="https://instagram.com/p/…"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark"
            />
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            El enlace a la publicación, al vídeo o a la foto. Es lo que le enseñarás a la empresa
            cuando toque renovar.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
            >
              Guardar como hecho
            </button>
            <button
              type="button"
              onClick={() => setPidiendoPrueba(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-3">
          <AvisoError mensaje={error} />
        </div>
      )}
    </li>
  );
}

function Boton({
  accion,
  id,
  estado,
  children,
}: {
  accion: (formData: FormData) => void;
  id: string;
  estado: string;
  children: React.ReactNode;
}) {
  return (
    <form action={accion}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
      >
        {children}
      </button>
    </form>
  );
}
