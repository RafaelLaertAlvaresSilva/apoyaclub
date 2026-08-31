"use client";

import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "@/app/panel/components/SeccionCard";
import {
  ESTADOS_OPORTUNIDAD,
  FORMAS_COLABORACION,
  OBJETIVOS_OPORTUNIDAD,
  PERIODOS_OPORTUNIDAD,
  TIPOS_OPORTUNIDAD,
} from "@/lib/opportunities";
import type { BudgetPeriod, CollaborationType, ObjectiveTag, OpportunityStatus, OpportunityType } from "@/lib/types";
import type { EstadoGuardado } from "../actions";

export type ValoresOportunidad = {
  title?: string;
  description?: string | null;
  opportunityType?: OpportunityType;
  value?: number;
  duration?: string | null;
  status?: OpportunityStatus;
  // Fase 7: campos opcionales que alimentan los filtros del buscador.
  period?: BudgetPeriod | null;
  collaborationType?: CollaborationType | null;
  objectives?: ObjectiveTag[];
};

/**
 * Formulario de una oportunidad, compartido por la creación y la
 * edición. Cada campo lleva su propia ayuda contextual con ejemplos
 * reales, tal y como pide la Fase 6.
 */
export function OportunidadForm({
  titulo,
  idOportunidad,
  accion,
  estado,
  valoresIniciales,
  mostrarEstado = false,
  textoBoton,
  onCancelar,
}: {
  titulo?: string;
  idOportunidad?: string;
  accion: (formData: FormData) => void;
  estado: EstadoGuardado;
  valoresIniciales?: ValoresOportunidad;
  mostrarEstado?: boolean;
  textoBoton: string;
  onCancelar?: () => void;
}) {
  const contenidoFormulario = (
    <form action={accion} className="space-y-4">
      {idOportunidad && <input type="hidden" name="id" value={idOportunidad} />}

      <Campo
        etiqueta="Nombre de la oportunidad *"
        ayuda='Ejemplos: "Patrocinio del descanso de los partidos de casa", "Camiseta de entrenamiento de la cantera".'
      >
        <input
          name="title"
          required
          defaultValue={valoresIniciales?.title ?? ""}
          className={clasesInput}
        />
      </Campo>

      <Campo etiqueta="Tipo *" ayuda="Agrupa la oportunidad dentro del catálogo del club.">
        <select
          name="opportunityType"
          required
          defaultValue={valoresIniciales?.opportunityType ?? ""}
          className={clasesInput}
        >
          <option value="" disabled>
            Elige un tipo…
          </option>
          {TIPOS_OPORTUNIDAD.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        etiqueta="Qué incluye"
        ayuda="Describe con detalle qué recibe la empresa a cambio de su patrocinio."
      >
        <textarea
          name="description"
          defaultValue={valoresIniciales?.description ?? ""}
          className={clasesTextarea}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Duración" ayuda='Ejemplos: "Toda la temporada", "Un partido", "3 meses".'>
          <input
            name="duration"
            defaultValue={valoresIniciales?.duration ?? ""}
            className={clasesInput}
          />
        </Campo>

        <Campo etiqueta="Valor (€) *" ayuda="Lo fijas tú: la plataforma no sugiere ni impone precios.">
          <input
            name="value"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={valoresIniciales?.value ?? ""}
            className={clasesInput}
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Periodo"
          ayuda="A qué se refiere el valor. Ayuda a las empresas a comparar presupuestos en el buscador."
        >
          <select
            name="period"
            defaultValue={valoresIniciales?.period ?? ""}
            className={clasesInput}
          >
            <option value="">Sin especificar</option>
            {PERIODOS_OPORTUNIDAD.map((periodo) => (
              <option key={periodo.id} value={periodo.id}>
                {periodo.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Forma de colaboración" ayuda="Cómo puede aportar la empresa, además del dinero.">
          <select
            name="collaborationType"
            defaultValue={valoresIniciales?.collaborationType ?? ""}
            className={clasesInput}
          >
            <option value="">Sin especificar</option>
            {FORMAS_COLABORACION.map((forma) => (
              <option key={forma.id} value={forma.id}>
                {forma.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo
        etiqueta="Objetivo"
        ayuda="A qué público o objetivo apela esta oportunidad. Puedes marcar varios."
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
            <label key={objetivo.id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="objectives"
                value={objetivo.id}
                defaultChecked={valoresIniciales?.objectives?.includes(objetivo.id) ?? false}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {objetivo.etiqueta}
            </label>
          ))}
        </div>
      </Campo>

      {mostrarEstado && (
        <Campo etiqueta="Estado">
          <select
            name="status"
            defaultValue={valoresIniciales?.status ?? "available"}
            className={clasesInput}
          >
            {ESTADOS_OPORTUNIDAD.map((estadoOpcion) => (
              <option key={estadoOpcion.id} value={estadoOpcion.id}>
                {estadoOpcion.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

      <div className="flex gap-2">
        <BotonEnviar>{textoBoton}</BotonEnviar>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );

  if (!titulo) return contenidoFormulario;

  return <SeccionCard titulo={titulo}>{contenidoFormulario}</SeccionCard>;
}
