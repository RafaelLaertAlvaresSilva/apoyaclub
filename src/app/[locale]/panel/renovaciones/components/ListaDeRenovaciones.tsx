"use client";

import { useActionState, useState } from "react";
import {
  cuantoFalta,
  estadoDeRenovacion,
  mensajeDeRenovacion,
  type EstadoRenovacion,
} from "@/lib/renovaciones";
import type { ClubSponsor } from "@/lib/types";
import { guardarRenovacion, type EstadoGuardado } from "../actions";

/**
 * Cada patrocinador con sus dos fechas, lo acordado y el mensaje listo
 * para copiar.
 *
 * El día de hoy llega como prop desde el servidor y no se calcula aquí
 * con `new Date()`: si cada mitad usara su propio reloj, el servidor
 * pintaría "faltan 3 días" y el navegador del club, en otra zona
 * horaria, "faltan 2", y React avisaría de que el HTML no coincide.
 */

const ASPECTO: Record<EstadoRenovacion, { caja: string; pastilla: string; texto: string }> = {
  pasada: {
    caja: "border-red-300 bg-red-50/60",
    pastilla: "bg-red-600 text-white",
    texto: "Se pasó",
  },
  urgente: {
    caja: "border-amber-300 bg-amber-50/60",
    pastilla: "bg-amber-500 text-white",
    texto: "Corre prisa",
  },
  proxima: {
    caja: "border-zinc-200 bg-white",
    pastilla: "bg-teal-100 text-teal-800",
    texto: "Se acerca",
  },
  "al-dia": {
    caja: "border-zinc-200 bg-white",
    pastilla: "bg-zinc-100 text-zinc-600",
    texto: "Al día",
  },
  "sin-fecha": {
    caja: "border-dashed border-zinc-300 bg-zinc-50",
    pastilla: "bg-zinc-200 text-zinc-700",
    texto: "Sin fecha",
  },
};

export function ListaDeRenovaciones({
  patrocinadores,
  nombreDelClub,
  temporada,
  hoyISO,
}: {
  patrocinadores: ClubSponsor[];
  nombreDelClub: string;
  temporada: string;
  hoyISO: string;
}) {
  const [anio, mes, dia] = hoyISO.split("-").map(Number);
  const hoy = new Date(anio, mes - 1, dia);

  return (
    <ul className="space-y-4">
      {patrocinadores.map((patrocinador) => (
        <li key={patrocinador.id}>
          <FichaDeRenovacion
            patrocinador={patrocinador}
            nombreDelClub={nombreDelClub}
            temporada={temporada}
            hoy={hoy}
          />
        </li>
      ))}
    </ul>
  );
}

function FichaDeRenovacion({
  patrocinador,
  nombreDelClub,
  temporada,
  hoy,
}: {
  patrocinador: ClubSponsor;
  nombreDelClub: string;
  temporada: string;
  hoy: Date;
}) {
  const [estado, accion, enviando] = useActionState<EstadoGuardado, FormData>(
    guardarRenovacion,
    null,
  );
  const [verMensaje, setVerMensaje] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const situacion = estadoDeRenovacion(patrocinador, hoy);
  const aspecto = ASPECTO[situacion];
  const mensaje = mensajeDeRenovacion({ patrocinador, nombreDelClub, temporada });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso de portapapeles —pasa en algunos navegadores de
      // móvil— el texto sigue a la vista y se puede seleccionar a mano.
      setCopiado(false);
    }
  }

  return (
    <div className={`rounded-xl border p-5 ${aspecto.caja}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-900">{patrocinador.name}</h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            {patrocinador.sinceYear ? `Con el club desde ${patrocinador.sinceYear}` : "Sin fecha de inicio"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${aspecto.pastilla}`}
        >
          {/* "Se pasó · Se pasó hace 16 días" lo decía dos veces: en lo
              vencido, la frase de los días ya dice el estado ella sola. */}
          {situacion === "pasada" && patrocinador.renewalDate
            ? cuantoFalta(patrocinador.renewalDate, hoy)
            : `${aspecto.texto}${
                patrocinador.renewalDate
                  ? ` · ${cuantoFalta(patrocinador.renewalDate, hoy)}`
                  : ""
              }`}
        </span>
      </div>

      <form action={accion} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="patrocinadorId" value={patrocinador.id} />

        <label className="text-sm">
          <span className="font-medium text-zinc-700">Cuándo escribir</span>
          <input
            type="date"
            name="renewalDate"
            defaultValue={patrocinador.renewalDate ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Ponla antes de que acabe el acuerdo, con margen para hablarlo.
          </span>
        </label>

        <label className="text-sm">
          <span className="font-medium text-zinc-700">Cuándo acaba el acuerdo</span>
          <input
            type="date"
            name="agreementEndsOn"
            defaultValue={patrocinador.agreementEndsOn ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700">Qué acordasteis</span>
          <textarea
            name="renewalNotes"
            rows={2}
            defaultValue={patrocinador.renewalNotes ?? ""}
            placeholder="600 € por temporada, logo en la camiseta y dos publicaciones al mes."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Lo que hoy está en la cabeza de quien lo firmó. Cuando cambie la junta, esto es lo
            único que queda.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
          >
            {enviando ? "Guardando…" : "Guardar"}
          </button>

          <button
            type="button"
            onClick={() => setVerMensaje((abierto) => !abierto)}
            aria-expanded={verMensaje}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {verMensaje ? "Ocultar el mensaje" : "Qué escribirle"}
          </button>

          {estado?.error && <p className="text-sm text-red-700">{estado.error}</p>}
          {estado?.ok && <p className="text-sm text-teal-700">Guardado.</p>}
        </div>
      </form>

      {verMensaje && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">
            Un punto de partida, no un correo para mandar tal cual: cámbialo a vuestra manera de
            hablar antes de enviarlo.
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800">
            {mensaje}
          </pre>
          <button
            type="button"
            onClick={copiar}
            className="mt-3 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
