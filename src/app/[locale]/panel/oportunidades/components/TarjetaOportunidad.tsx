"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { ClubTeam, Opportunity, OpportunityStatus } from "@/lib/types";
import {
  CLASES_NIVEL_PATROCINIO,
  ESTADOS_OPORTUNIDAD,
  ETIQUETA_NIVEL_PATROCINIO,
  ETIQUETA_TIPO_OPORTUNIDAD,
  formatoValorOportunidad,
} from "@/lib/opportunities";
import {
  actualizarOportunidad,
  archivarOportunidad,
  compartirComoPlantilla,
  cambiarEstadoOportunidad,
  duplicarOportunidad,
  eliminarOportunidad,
  restaurarOportunidad,
} from "../actions";
import { OportunidadForm } from "./OportunidadForm";

const ESTILO_ESTADO: Record<OpportunityStatus, string> = {
  available: "bg-teal-700 text-white",
  reserved: "bg-amber-500 text-white",
  closed: "bg-zinc-400 text-white",
};

export function TarjetaOportunidad({
  oportunidad,
  equipos = [],
}: {
  oportunidad: Opportunity;
  equipos?: ClubTeam[];
}) {
  const t = useTranslations("panel.oportunidades");
  const [enEdicion, setEnEdicion] = useState(false);

  if (enEdicion) {
    return (
      <EditorOportunidad
        oportunidad={oportunidad}
        equipos={equipos}
        onCerrar={() => setEnEdicion(false)}
      />
    );
  }

  const equipoAsociado = equipos.find((equipo) => equipo.id === oportunidad.teamId) ?? null;

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{oportunidad.title}</h3>
            {oportunidad.sponsorLevel !== "libre" && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  CLASES_NIVEL_PATROCINIO[oportunidad.sponsorLevel]
                }`}
              >
                {ETIQUETA_NIVEL_PATROCINIO[oportunidad.sponsorLevel]}
              </span>
            )}
            {oportunidad.archivedAt && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">{t("archivada")}</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {ETIQUETA_TIPO_OPORTUNIDAD[oportunidad.opportunityType]}
            {oportunidad.duration ? ` · ${oportunidad.duration}` : ""}
            {equipoAsociado ? ` · ${equipoAsociado.sport} ${equipoAsociado.category ?? ""}`.trimEnd() : ""}
          </p>
          {oportunidad.exclusivity && (
            <p className="mt-1 text-xs font-medium text-brand-teal-dark">
              En exclusiva para el sector: {oportunidad.exclusivity}
            </p>
          )}
          {oportunidad.description && (
            <p className="mt-2 text-sm text-zinc-600">{oportunidad.description}</p>
          )}
        </div>

        <p className="whitespace-nowrap text-lg font-bold text-teal-700">
          {formatoValorOportunidad.format(oportunidad.value)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
        {!oportunidad.archivedAt && (
          <div className="flex overflow-hidden rounded-lg border border-zinc-300">
            {ESTADOS_OPORTUNIDAD.map((estadoOpcion) => (
              <form key={estadoOpcion.id} action={cambiarEstadoOportunidad}>
                <input type="hidden" name="id" value={oportunidad.id} />
                <input type="hidden" name="status" value={estadoOpcion.id} />
                <button
                  type="submit"
                  disabled={oportunidad.status === estadoOpcion.id}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default ${
                    oportunidad.status === estadoOpcion.id
                      ? ESTILO_ESTADO[estadoOpcion.id]
                      : "bg-white text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {estadoOpcion.etiqueta}
                </button>
              </form>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setEnEdicion(true)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >{t("editar")}</button>

        <form action={compartirComoPlantilla}>
          <input type="hidden" name="id" value={oportunidad.id} />
          <button
            type="submit"
            title={t("compartirPlantillaAyuda")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            {t("compartirPlantilla")}
          </button>
        </form>

        <form action={duplicarOportunidad}>
          <input type="hidden" name="id" value={oportunidad.id} />
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >{t("duplicar")}</button>
        </form>

        {oportunidad.archivedAt ? (
          <form action={restaurarOportunidad}>
            <input type="hidden" name="id" value={oportunidad.id} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >{t("restaurar")}</button>
          </form>
        ) : (
          <form action={archivarOportunidad}>
            <input type="hidden" name="id" value={oportunidad.id} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >{t("archivar")}</button>
          </form>
        )}

        <form action={eliminarOportunidad}>
          <input type="hidden" name="id" value={oportunidad.id} />
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >{t("eliminar")}</button>
        </form>
      </div>
    </li>
  );
}

/** Aparte para que `useActionState` empiece limpio cada vez que se abre
 * la edición (el componente se monta de nuevo, en vez de reutilizar un
 * estado de un guardado anterior). Al guardar no se cierra sola: se ve
 * el aviso de "Guardado." y el club cierra con "Cancelar" cuando quiera,
 * igual que el resto de formularios del panel. */
function EditorOportunidad({
  oportunidad,
  onCerrar,
  equipos,
}: {
  oportunidad: Opportunity;
  onCerrar: () => void;
  equipos: ClubTeam[];
}) {
  const [estado, formAction] = useActionState(actualizarOportunidad, null);

  return (
    <li className="rounded-xl border border-teal-200 bg-white p-6">
      <OportunidadForm
        idOportunidad={oportunidad.id}
        accion={formAction}
        estado={estado}
        mostrarEstado
        equipos={equipos}
        textoBoton="Guardar cambios"
        onCancelar={onCerrar}
        valoresIniciales={{
          title: oportunidad.title,
          description: oportunidad.description,
          opportunityType: oportunidad.opportunityType,
          value: oportunidad.value,
          duration: oportunidad.duration,
          status: oportunidad.status,
          period: oportunidad.period,
          collaborationType: oportunidad.collaborationType,
          objectives: oportunidad.objectives,
          sponsorLevel: oportunidad.sponsorLevel,
          exclusivity: oportunidad.exclusivity,
          teamId: oportunidad.teamId,
        }}
      />
    </li>
  );
}
