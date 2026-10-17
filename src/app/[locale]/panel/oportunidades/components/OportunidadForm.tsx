"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BloquePlegable } from "@/components/BloquePlegable";
import type { Accion, Beneficio } from "@/lib/ficha-oportunidad";
import { EditorDeLaFicha } from "./EditorDeLaFicha";
import { FotosDeLaOportunidad } from "./FotosDeLaOportunidad";
import { BotonEnviar } from "@/components/BotonEnviar";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import {
  Campo,
  SeccionCard,
  clasesInput,
  clasesTextarea,
} from "@/app/[locale]/panel/components/SeccionCard";
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
  /** Hasta tres fotos de lo que se ofrece (migración 0052). */
  fotos?: string[];
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
  // Migración 0049: la ficha detallada.
  beneficios?: Beneficio[];
  acciones?: Accion[];
  frecuencia?: string | null;
  desde?: string | null;
  hasta?: string | null;
  requisitos?: string | null;
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
  userId,
}: {
  titulo?: string;
  idOportunidad?: string;
  accion: (formData: FormData) => void;
  estado: EstadoGuardado;
  valoresIniciales?: ValoresOportunidad;
  mostrarEstado?: boolean;
  textoBoton: string;
  onCancelar?: () => void;
  /**
   * El identificador del club, que necesita el subidor de imágenes: el
   * almacén guarda cada archivo en la carpeta de quien lo sube y la
   * política solo deja escribir en la propia.
   */
  userId: string;
  /** Equipos del club, para poder asociar la oportunidad a uno concreto. */
  equipos?: ClubTeam[];
}) {
  const t = useTranslations("panel.oportunidades");
  const tComun = useTranslations("panel.comun");
  const E = etiquetador(useTranslations("common.etiquetas"));

  // Qué clase de oportunidad es. Cambia lo que se enseña debajo, así
  // que vive en el componente y no solo en el formulario.
  const [esNecesidad, setEsNecesidad] = useState(
    valoresIniciales?.esNecesidad ?? false,
  );

  const contenidoFormulario = (
    <form action={accion} className="space-y-4">
      {idOportunidad && <input type="hidden" name="id" value={idOportunidad} />}

      {/* Lo primero de todo, porque cambia el sentido de lo que viene
          detrás. Una oportunidad normal es "te doy visibilidad, me das
          dinero"; una necesidad es "necesito un fisio y te doy
          visibilidad a cambio". Es la misma ficha con la flecha al
          revés, y para un fisioterapeuta del barrio es probablemente
          la mejor oportunidad que hay en la plataforma. */}
      <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <legend className="float-left mb-3 w-full text-[15px] font-bold text-titular">
          {t("queEsEsto")}
        </legend>
        <div className="clear-both grid gap-2 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 transition-colors ${
              esNecesidad
                ? "border-zinc-200 bg-white hover:bg-zinc-50"
                : "border-teal-500 bg-teal-50"
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
              <span className="block text-sm font-medium text-zinc-900">{t("ofrezcoPatrocinio")}</span>
              <span className="block text-xs text-zinc-500">{t("ofrezcoPatrocinioTexto")}</span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer gap-2.5 rounded-lg border p-3 transition-colors ${
              esNecesidad
                ? "border-amber-500 bg-amber-50"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
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
              <span className="block text-sm font-medium text-zinc-900">{t("necesitoServicio")}</span>
              <span className="block text-xs text-zinc-500">{t("necesitoServicioTexto")}</span>
            </span>
          </label>
        </div>

        {esNecesidad && (
          <div className="mt-4">
            <Campo
              etiqueta={t("queNecesitas")}
              ayuda={t("queNecesitasAyuda")}
            >
              <select
                name="categoriaNecesidad"
                required
                defaultValue={valoresIniciales?.categoriaNecesidad ?? ""}
                className={clasesInput}
              >
                <option value="" disabled>
                  {t("eligeQueNecesitas")}
                </option>
                {CATEGORIAS_NECESIDAD.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {E.categoriaNecesidad(categoria.id)}
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
          <option value="" disabled>
            {t("eligeUnTipo")}
          </option>
          {TIPOS_OPORTUNIDAD.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {E.tipoOportunidad(tipo.id)}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta={t("queIncluye")} ayuda={t("describeConDetalleQue")}>
        <textarea
          name="description"
          defaultValue={valoresIniciales?.description ?? ""}
          className={clasesTextarea}
        />
      </Campo>

      <Campo
        etiqueta={t("fotos")}
        ayuda={t("fotosAyuda")}
      >
        <FotosDeLaOportunidad
          userId={userId}
          iniciales={valoresIniciales?.fotos ?? []}
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

        {/* El precio, solo cuando el club ofrece patrocinio.
         *
         * Si lo que publica es que NECESITA un fisio o un autobús,
         * no hay precio que poner: lo que se ofrece es el servicio
         * en sí, y a cambio va visibilidad. Pedirle un importe
         * obligatorio dejaba al club mirando una casilla que no sabe
         * rellenar, y lo que acababa escribiendo era un cero que
         * luego salía publicado. */}
        {!esNecesidad && (
          <Campo etiqueta={t("valorEuros")} ayuda={t("loFijasTuLa")}>
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
        )}
      </div>

      {/* A partir de aquí, todo opcional.
       *
       * Publicar la primera oportunidad es lo que tiene que pasar
       * para que esto sirva de algo, y la pantalla pedía catorce
       * cosas de golpe —periodo, forma de colaboración, nivel,
       * exclusividad, equipo, plazas y seis casillas de objetivo—
       * cuando solo hacen falta tres. Parecía un impreso
       * administrativo justo en el momento que más cuesta. */}
      {/* La ficha: lo que convierte un precio en un acuerdo. Va antes
          de "Más detalles" porque importa mucho más que el nivel de
          patrocinador o el periodo, y abierta cuando ya tiene algo
          escrito para que se vea que está. */}
      <BloquePlegable
        titulo={t("queRecibeEmpresa")}
        resumen={t("queRecibeEmpresaResumen")}
        /* Abierto siempre.
         *
         * Lo tuve plegado cuando estaba vacío, para no alargar un
         * formulario ya largo. El resultado fue que no se veía: quien
         * entraba a editar rellenaba los campos de siempre, guardaba, y
         * la ficha seguía en blanco sin que nada explicara por qué.
         * Una función que hay que descubrir es una función que no
         * existe. */
        abierto
      >
        <EditorDeLaFicha
          beneficios={valoresIniciales?.beneficios ?? []}
          acciones={valoresIniciales?.acciones ?? []}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta={t("frecuencia")}
            ayuda={t("frecuenciaAyuda")}
          >
            <input
              name="frecuencia"
              maxLength={120}
              defaultValue={valoresIniciales?.frecuencia ?? ""}
              placeholder={t("frecuenciaEjemplo")}
              className={clasesInput}
            />
          </Campo>

          <Campo
            etiqueta={t("desdeHasta")}
            grupo
            ayuda={t("desdeHastaAyuda")}
          >
            <div className="flex gap-2">
              <input
                name="desde"
                type="date"
                defaultValue={valoresIniciales?.desde ?? ""}
                aria-label={t("desde")}
                className={clasesInput}
              />
              <input
                name="hasta"
                type="date"
                defaultValue={valoresIniciales?.hasta ?? ""}
                aria-label={t("hasta")}
                className={clasesInput}
              />
            </div>
          </Campo>
        </div>

        <div className="mt-4">
          <Campo
            etiqueta={t("otrosRequisitos")}
            ayuda={t("otrosRequisitosAyuda")}
          >
            <textarea
              name="requisitos"
              maxLength={1000}
              defaultValue={valoresIniciales?.requisitos ?? ""}
              className={clasesTextarea}
            />
          </Campo>
        </div>
      </BloquePlegable>

      <BloquePlegable
        titulo={t("masDetalles")}
        resumen={t("masDetallesResumen")}
        abierto={!!idOportunidad}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("periodo")} ayuda={t("aQueSeRefiere")}>
            <select
              name="period"
              defaultValue={valoresIniciales?.period ?? ""}
              className={clasesInput}
            >
              <option value="">{t("sinEspecificar")}</option>
              {PERIODOS_OPORTUNIDAD.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {E.periodo(periodo.id)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            etiqueta={t("formaDeColaboracion")}
            ayuda={t("comoPuedeAportarLa")}
          >
            <select
              name="collaborationType"
              defaultValue={valoresIniciales?.collaborationType ?? ""}
              className={clasesInput}
            >
              <option value="">{t("sinEspecificar")}</option>
              {FORMAS_COLABORACION.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {E.formaColaboracion(forma.id)}
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
                  {E.nivelPatrocinio(nivel.id)}
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
            ayuda={t("equipoAsociadoAyuda")}
          >
            <select
              name="teamId"
              defaultValue={valoresIniciales?.teamId ?? ""}
              className={clasesInput}
            >
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
            etiqueta={
              esNecesidad ? t("cuantosColaboradores") : t("plazas")
            }
            ayuda={
              esNecesidad
                ? t("cuantosColaboradoresAyuda")
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
            etiqueta={esNecesidad ? t("cuantosTienesYa") : t("plazasCubiertas")}
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

        <Campo grupo etiqueta={t("objetivo")} ayuda={t("aQuePublicoO")}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
              <label
                key={objetivo.id}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  name="objectives"
                  value={objetivo.id}
                  defaultChecked={
                    valoresIniciales?.objectives?.includes(objetivo.id) ?? false
                  }
                  className="rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
                />
                {E.objetivo(objetivo.id)}
              </label>
            ))}
          </div>
        </Campo>
      </BloquePlegable>

      {mostrarEstado && (
        <Campo etiqueta={t("estado")}>
          <select
            name="status"
            defaultValue={valoresIniciales?.status ?? "available"}
            className={clasesInput}
          >
            {ESTADOS_OPORTUNIDAD.map((estadoOpcion) => (
              <option key={estadoOpcion.id} value={estadoOpcion.id}>
                {E.estadoOportunidad(estadoOpcion.id)}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito
        mensaje={estado && "ok" in estado && estado.ok ? tComun("guardado") : null}
      />

      <div className="flex gap-2">
        <BotonEnviar>{textoBoton}</BotonEnviar>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {t("cancelar")}
          </button>
        )}
      </div>
    </form>
  );

  if (!titulo) return contenidoFormulario;

  return <SeccionCard titulo={titulo}>{contenidoFormulario}</SeccionCard>;
}
