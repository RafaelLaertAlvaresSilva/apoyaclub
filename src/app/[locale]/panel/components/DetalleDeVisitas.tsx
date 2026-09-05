"use client";

import { useState } from "react";
import type { ResumenDeVisitas } from "@/lib/club-metrics";

/**
 * Quién ha entrado en la ficha, por semana o por mes.
 *
 * Las tarjetas de arriba comparan un periodo con el anterior, que es lo
 * que sirve para ver si algo va a mejor. Esto es otra pregunta: cuánta
 * gente ha pasado, cuántas de esas eran empresas y cuántas llegaron a
 * abrir el contacto. Es el embudo, y leído de izquierda a derecha
 * cuenta una historia — cuánta gente mira, cuánta se interesa de verdad.
 */
export function DetalleDeVisitas({ resumen }: { resumen: ResumenDeVisitas }) {
  const [ventana, setVentana] = useState<"semana" | "mes">("semana");
  const datos = ventana === "semana" ? resumen.semana : resumen.mes;

  const sinNada = resumen.totalVisitas === 0 && resumen.totalContactos === 0;
  if (sinNada) return null;

  return (
    <div className="mt-5 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">Quién ha entrado en tu ficha</h3>

        <div className="flex rounded-lg border border-zinc-300 p-0.5">
          {(["semana", "mes"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setVentana(opcion)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                ventana === opcion ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {opcion === "semana" ? "Últimos 7 días" : "Últimos 30 días"}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Dato
          valor={datos.visitas}
          etiqueta="Han visto tu ficha"
          ayuda="Personas que han abierto tu página. Recargar no cuenta dos veces."
        />
        <Dato
          valor={datos.contactos}
          etiqueta="Han abierto tu contacto"
          ayuda="Han pulsado para ver tu teléfono y tu correo. Es el paso justo antes de escribirte."
        />
      </dl>

      <p className="mt-3 text-xs text-zinc-500">
        Desde que estás en ApoyaClub: {resumen.totalVisitas}{" "}
        {resumen.totalVisitas === 1 ? "visita" : "visitas"} y {resumen.totalContactos}{" "}
        {resumen.totalContactos === 1 ? "apertura" : "aperturas"} de tus datos de contacto.
      </p>
    </div>
  );
}

function Dato({ valor, etiqueta, ayuda }: { valor: number; etiqueta: string; ayuda: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{etiqueta}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-brand-navy">{valor}</dd>
      <p className="mt-1 text-xs leading-snug text-zinc-500">{ayuda}</p>
    </div>
  );
}
