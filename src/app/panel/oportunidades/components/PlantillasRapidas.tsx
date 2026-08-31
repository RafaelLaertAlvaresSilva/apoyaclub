"use client";

import { PLANTILLAS_OPORTUNIDAD, TIPOS_OPORTUNIDAD, type PlantillaOportunidad } from "@/lib/opportunities";
import type { OpportunityType } from "@/lib/types";

/**
 * Plantillas rápidas agrupadas por tipo (Fase 6). Elegir una rellena el
 * formulario de creación con un título y una descripción de ejemplo;
 * el club sigue teniendo que fijar el valor y, si quiere, la duración.
 */
export function PlantillasRapidas({
  onElegir,
}: {
  onElegir: (tipo: OpportunityType, plantilla: PlantillaOportunidad) => void;
}) {
  return (
    <div className="mb-6 rounded-lg border border-dashed border-zinc-300 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-700">
        Plantillas rápidas <span className="font-normal text-zinc-400">(opcional, para no partir de cero)</span>
      </p>
      <div className="space-y-4">
        {TIPOS_OPORTUNIDAD.map((tipo) => (
          <div key={tipo.id}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {tipo.etiqueta}
            </p>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS_OPORTUNIDAD[tipo.id].map((plantilla) => (
                <button
                  key={plantilla.title}
                  type="button"
                  onClick={() => onElegir(tipo.id, plantilla)}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {plantilla.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
