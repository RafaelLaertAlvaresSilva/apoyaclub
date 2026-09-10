"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "@/app/[locale]/panel/components/SeccionCard";
import {
  CATEGORIAS_NECESIDAD,
  ESTADOS_OPORTUNIDAD,
  FORMAS_COLABORACION,
  NIVELES_PATROCINIO,
  OBJETIVOS_OPORTUNIDAD,
  PERIODOS_OPORTUNIDAD,
  TIPOS_OPORTUNIDAD,
  etiquetaEquipo,
} from "@/lib/opportunities";
import type {
  BudgetPeriod,
  CategoriaNecesidad,
  ClubTeam,
  CollaborationType,
  ObjectiveTag,
  OpportunityStatus,
  OpportunityType,
  SponsorLevel,
} from "@/lib/types";
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
  // Campos de la Fase 2 que faltaban: nivel de patrocinador,
  // exclusividad de sector y equipo asociado.
  sponsorLevel?: SponsorLevel;
  exclusivity?: string | null;
  teamId?: string | null;
  // Fase 17: oportunidad repartida entre varias empresas.
  slotsTotal?: number | null;
  slotsTaken?: number;
  // Migración 0038: la oportunidad al revés — el club necesita algo.
  esNecesidad?: boolean;
  categoriaNecesidad?: CategoriaNecesidad | null;
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
  equipos = [],
}: {
  titulo?: string;
  idOportunidad?: string;
  accion: (formData: FormData) => void;
  estado: EstadoGuardado;
  valoresIniciales?: ValoresOportunidad;
  mostrarEstado?: boolean;
  textoBoton: string;
  onCancelar?: () => void;
  /** Equipos del club, para poder asociar la oportunidad a uno concreto. */
  equipos?: ClubTeam[];
}) {
  const t = useTranslations("panel.oportunidades");

  // Qué clase de oportunidad es. Cambia lo que se enseña debajo, así
  // que vive en el componente y no solo en el formulario.
  const [esNecesidad, setEsNecesidad] = useState(valoresIniciales?.esNecesidad ?? false);

  const contenidoFormulario = (
    <form action={accion} className="space-y-4">
      {idOportunidad && <input type="hidden" name="id" value={idOportunidad} />}

      {/* Lo primero de todo, porque cambia el sentido de lo que viene
          detrás. Una oportunidad normal es "te doy visibilidad, me das
          dinero"; una necesidad es "necesito un fisio y te doy
          visibilidad a cambio". Es la misma ficha con la flecha al
          revés, y para un fisioterapeuta del barrio es probablemente
          la mejor oportunidad que hay en la plataforma. */}
      <fieldset className="rounded-lg border border-zinc-200 p-4">
        <legend className="px-1 text-sm font-medium text-zinc-700">¿Qué es esto?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 transition-colors ${
              esNecesidad ? "border-zinc-200 hover:bg-zinc-50" : "border-teal-500 bg-teal-50"
            }`}
          >
            <input
              type="radio"
              name="esNecesidad"
              value="no"
              checked={!esNecesidad}
              onChange={() => setEsNecesidad(false)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">Ofrezco patrocinio</span>
              <span className="block text-xs text-zinc-500">
                Doy visibilidad a la empresa y ella aporta dinero.
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 transition-colors ${
              esNecesidad ? "border-amber-500 bg-amber-50" : "border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <input
              type="radio"
              name="esNecesidad"
              value="si"
              checked={esNecesidad}
              onChange={() => setEsNecesidad(true)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Necesito un servicio o producto
              </span>
              <span className="block text-xs text-zinc-500">
                Fisio, autobús, fotógrafo, material… y doy visibilidad a cambio.
              </span>
            </span>
          </label>
        </div>

        {esNecesidad && (
          <div className="mt-4">
            <Campo
              etiqueta="Qué necesitas"
              ayuda="Sirve para que una empresa de ese ramo te encuentre buscando lo suyo."
            >
              <select
                name="categoriaNecesidad"
                required
                defaultValue={valoresIniciales?.categoriaNecesidad ?? ""}
                className={clasesInput}
              >
                <option value="" disabled>Elige qué necesitas</option>
                {CATEGORIAS_NECESIDAD.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        )}
      </fieldset>

      <Campo
        etiqueta={t("nombreDeLaOportunidad")}
        ayuda={t("ejemplosPatrocinioDelDescanso")}
      >
        <input
          name="title"
          required
          defaultValue={valoresIniciales?.title ?? ""}
          className={clasesInput}
        />
      </Campo>

      <Campo etiqueta={t("tipo")} ayuda={t("agrupaLaOportunidadDentro")}>
        <select
          name="opportunityType"
          required
          defaultValue={valoresIniciales?.opportunityType ?? ""}
          className={clasesInput}
        >
          <option value="" disabled>{t("eligeUnTipo")}</option>
          {TIPOS_OPORTUNIDAD.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        etiqueta={t("queIncluye")}
        ayuda={t("describeConDetalleQue")}
      >
        <textarea
          name="description"
          defaultValue={valoresIniciales?.description ?? ""}
          className={clasesTextarea}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta={t("duracion")} ayuda={t("ejemplosTodaLaTemporada")}>
          <input
            name="duration"
            defaultValue={valoresIniciales?.duration ?? ""}
            className={clasesInput}
          />
        </Campo>

        <Campo etiqueta="Valor (€) *" ayuda={t("loFijasTuLa")}>
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
          etiqueta={t("periodo")}
          ayuda={t("aQueSeRefiere")}
        >
          <select
            name="period"
            defaultValue={valoresIniciales?.period ?? ""}
            className={clasesInput}
          >
            <option value="">{t("sinEspecificar")}</option>
            {PERIODOS_OPORTUNIDAD.map((periodo) => (
              <option key={periodo.id} value={periodo.id}>
                {periodo.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta={t("formaDeColaboracion")} ayuda={t("comoPuedeAportarLa")}>
          <select
            name="collaborationType"
            defaultValue={valoresIniciales?.collaborationType ?? ""}
            className={clasesInput}
          >
            <option value="">{t("sinEspecificar")}</option>
            {FORMAS_COLABORACION.map((forma) => (
              <option key={forma.id} value={forma.id}>
                {forma.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta={t("nivelDePatrocinador")}
          ayuda={t("esLoPrimeroQue")}
        >
          <select
            name="sponsorLevel"
            defaultValue={valoresIniciales?.sponsorLevel ?? "libre"}
            className={clasesInput}
          >
            {NIVELES_PATROCINIO.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta={t("exclusividadDeSector")}
          ayuda={t("siLaEmpresaQue")}
        >
          <input
            name="exclusivity"
            defaultValue={valoresIniciales?.exclusivity ?? ""}
            className={clasesInput}
          />
        </Campo>
      </div>

      {equipos.length > 0 && (
        <Campo
          etiqueta={t("equipoAsociado")}
          ayuda="Si la oportunidad es de un equipo concreto (el primer equipo, un equipo de cantera). Déjalo en blanco si es del club entero."
        >
          <select name="teamId" defaultValue={valoresIniciales?.teamId ?? ""} className={clasesInput}>
            <option value="">{t("todoElClub")}</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {etiquetaEquipo(equipo) ?? equipo.sport}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta={esNecesidad ? "Cuántos colaboradores necesitas" : t("plazas")}
          ayuda={
            esNecesidad
              ? "Si con uno te vale, déjalo vacío. A partir de dos sale una barra con lo que llevas cubierto."
              : t("plazasAyuda")
          }
        >
          <input
            name="slotsTotal"
            type="number"
            min={0}
            step={1}
            defaultValue={valoresIniciales?.slotsTotal ?? ""}
            className={clasesInput}
          />
        </Campo>

        <Campo
          etiqueta={esNecesidad ? "Cuántos tienes ya" : t("plazasCubiertas")}
          ayuda={t("plazasCubiertasAyuda")}
        >
          <input
            name="slotsTaken"
            type="number"
            min={0}
            step={1}
            defaultValue={valoresIniciales?.slotsTaken ?? 0}
            className={clasesInput}
          />
        </Campo>
      </div>

      <Campo
        grupo
        etiqueta={t("objetivo")}
        ayuda={t("aQuePublicoO")}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
            <label key={objetivo.id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="objectives"
                value={objetivo.id}
                defaultChecked={valoresIniciales?.objectives?.includes(objetivo.id) ?? false}
                className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              {objetivo.etiqueta}
            </label>
          ))}
        </div>
      </Campo>

      {mostrarEstado && (
        <Campo etiqueta={t("estado")}>
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
          >{t("cancelar")}</button>
        )}
      </div>
    </form>
  );

  if (!titulo) return contenidoFormulario;

  return <SeccionCard titulo={titulo}>{contenidoFormulario}</SeccionCard>;
}
