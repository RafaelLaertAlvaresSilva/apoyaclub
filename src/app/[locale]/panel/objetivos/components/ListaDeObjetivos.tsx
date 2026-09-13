"use client";

import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { ORIGENES, ordenarParaTrabajar, resumirProspectos, type Prospecto } from "@/lib/prospectos";
import { guardarObjetivo } from "../actions";
import { FilaObjetivo } from "./FilaObjetivo";

const clasesInput =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

/**
 * La libreta de empresas del club.
 *
 * Lo de arriba no es la lista: es lo que el club tiene que hacer hoy.
 * La lista es lo que hay debajo.
 */
export function ListaDeObjetivos({ prospectos, hoy }: { prospectos: Prospecto[]; hoy: string }) {
  const [estado, alta] = useActionState(guardarObjetivo, null);
  const [abierto, setAbierto] = useState(prospectos.length === 0);

  const resumen = resumirProspectos(prospectos, hoy);
  const ordenados = ordenarParaTrabajar(prospectos, hoy);

  return (
    <div className="flex flex-col gap-6">
      {prospectos.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-4">
          <Dato numero={resumen.tocanHoy} etiqueta="Toca llamar hoy" destacado={resumen.tocanHoy > 0} />
          <Dato numero={resumen.porContactar} etiqueta="Por contactar" />
          <Dato numero={resumen.enConversacion} etiqueta="En conversación" />
          <Dato numero={resumen.acuerdos} etiqueta="Acuerdos cerrados" />
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-900">Apuntar una empresa</h2>
          {prospectos.length > 0 && (
            <button
              type="button"
              onClick={() => setAbierto((valor) => !valor)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
            >
              {abierto ? "Cerrar" : "+ Añadir empresa"}
            </button>
          )}
        </div>

        {abierto && (
          <form action={alta} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Empresa">
                <input name="nombre" required maxLength={160} placeholder="Ferretería Martínez" className={clasesInput} />
              </Campo>
              <Campo etiqueta="A qué se dedica (opcional)">
                <input name="sector" maxLength={120} placeholder="Ferretería" className={clasesInput} />
              </Campo>
              <Campo etiqueta="¿De dónde sale?">
                <select name="origen" defaultValue="familia" className={clasesInput}>
                  {ORIGENES.map((origen) => (
                    <option key={origen.id} value={origen.id}>
                      {origen.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Volver a llamar el (opcional)">
                <input type="date" name="proximoPaso" className={clasesInput} />
              </Campo>
              <Campo etiqueta="Con quién hablar (opcional)">
                <input
                  name="contactoNombre"
                  maxLength={120}
                  placeholder="Marta, la madre de Iker"
                  className={clasesInput}
                />
              </Campo>
              <Campo etiqueta="Teléfono o correo (opcional)">
                <input name="contactoDatos" maxLength={200} className={clasesInput} />
              </Campo>
            </div>

            <Campo etiqueta="Notas (opcional)">
              <textarea
                name="notas"
                rows={2}
                maxLength={1000}
                placeholder="Su hijo juega en alevín. Ya nos dio material el año pasado."
                className={clasesInput}
              />
            </Campo>

            <AvisoError mensaje={estado?.error ?? null} />
            <AvisoExito mensaje={estado?.ok ? "Apuntada." : null} />

            <BotonEnviar>Apuntar</BotonEnviar>
          </form>
        )}
      </section>

      {prospectos.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Por dónde empezar</h2>
          <p className="mt-1 text-sm text-zinc-600">
            No hace falta una lista de cien empresas. Hacen falta quince a las que alguien de tu
            club pueda llamar por su nombre. Míralo en este orden:
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {ORIGENES.filter((origen) => origen.pista).map((origen) => (
              <li key={origen.id} className="rounded-lg border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-900">{origen.etiqueta}</p>
                <p className="mt-0.5 text-sm text-zinc-600">{origen.pista}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenados.map((prospecto) => (
            <FilaObjetivo key={prospecto.id} prospecto={prospecto} hoy={hoy} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Dato({
  numero,
  etiqueta,
  destacado = false,
}: {
  numero: number;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        destacado ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p
        className={`text-2xl font-semibold tabular-nums ${
          destacado ? "text-amber-800" : "text-zinc-900"
        }`}
      >
        {numero}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-700">{etiqueta}</p>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{etiqueta}</span>
      {children}
    </label>
  );
}
