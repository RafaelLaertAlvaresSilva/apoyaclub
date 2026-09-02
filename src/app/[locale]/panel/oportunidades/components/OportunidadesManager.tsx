"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ClubTeam, Opportunity, OpportunityStatus } from "@/lib/types";
import type { PlantillasPorTipo } from "@/lib/opportunity-templates";
import { ESTADOS_OPORTUNIDAD } from "@/lib/opportunities";
import { NuevaOportunidad } from "./NuevaOportunidad";
import { TarjetaOportunidad } from "./TarjetaOportunidad";

type FiltroEstado = "todas" | OpportunityStatus;
type Orden = "recientes" | "valor_desc" | "valor_asc";

/** Panel principal de la Fase 6: alta de oportunidades + catálogo del
 * club con filtros por estado y valor. */
export function OportunidadesManager({
  oportunidades,
  equipos = [],
  plantillas,
}: {
  oportunidades: Opportunity[];
  equipos?: ClubTeam[];
  plantillas?: PlantillasPorTipo;
}) {
  const t = useTranslations("panel.oportunidades");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);

  const visibles = useMemo(() => {
    let lista = oportunidades.filter((oportunidad) =>
      mostrarArchivadas ? true : !oportunidad.archivedAt,
    );

    if (filtroEstado !== "todas") {
      lista = lista.filter((oportunidad) => oportunidad.status === filtroEstado);
    }

    lista = [...lista].sort((a, b) => {
      if (orden === "valor_desc") return b.value - a.value;
      if (orden === "valor_asc") return a.value - b.value;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return lista;
  }, [oportunidades, filtroEstado, orden, mostrarArchivadas]);

  return (
    <div className="space-y-6">
      <NuevaOportunidad key={oportunidades.length} equipos={equipos} plantillas={plantillas} />

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{t("estado")}</label>
            <select
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value as FiltroEstado)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="todas">{t("todosLosEstados")}</option>
              {ESTADOS_OPORTUNIDAD.map((estadoOpcion) => (
                <option key={estadoOpcion.id} value={estadoOpcion.id}>
                  {estadoOpcion.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{t("ordenarPorValor")}</label>
            <select
              value={orden}
              onChange={(evento) => setOrden(evento.target.value as Orden)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="recientes">{t("masRecientesPrimero")}</option>
              <option value="valor_desc">{t("valorDeMayorA")}</option>
              <option value="valor_asc">{t("valorDeMenorA")}</option>
            </select>
          </div>

          <label className="ml-auto flex items-center gap-2 pb-1.5 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={mostrarArchivadas}
              onChange={(evento) => setMostrarArchivadas(evento.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />{t("mostrarArchivadas")}</label>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          {oportunidades.length === 0
            ? "Todavía no has creado ninguna oportunidad. Empieza con el botón de arriba."
            : "No hay oportunidades que coincidan con estos filtros."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((oportunidad) => (
            <TarjetaOportunidad key={oportunidad.id} oportunidad={oportunidad} equipos={equipos} />
          ))}
        </ul>
      )}
    </div>
  );
}
