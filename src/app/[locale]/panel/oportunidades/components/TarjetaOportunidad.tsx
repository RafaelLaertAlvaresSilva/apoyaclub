"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { formatoDeValor } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { useActionState, useState } from "react";
import { AccionConConfirmacion } from "@/components/AccionConConfirmacion";
import type { ClubTeam, Opportunity, OpportunityStatus } from "@/lib/types";
import {
  CLASES_NIVEL_PATROCINIO,
  ESTADOS_OPORTUNIDAD,
  esPorPlazas,
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
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { fotoDePortada } from "@/lib/fotos-de-oportunidad";
import { OportunidadForm } from "./OportunidadForm";

const ESTILO_ESTADO: Record<OpportunityStatus, string> = {
  available: "bg-accion text-sobre-color",
  reserved: "bg-aviso text-sobre-aviso",
  closed: "bg-zinc-400 text-sobre-color",
};

export function TarjetaOportunidad({
  oportunidad,
  equipos = [],
  slugDelClub = null,
  userId,
}: {
  oportunidad: Opportunity;
  equipos?: ClubTeam[];
  /** La dirección pública del club, o null si todavía no tiene ficha. */
  slugDelClub?: string | null;
  /** El identificador del club, para subir las fotos al almacén. */
  userId: string;
}) {
  const t = useTranslations("panel.oportunidades");
  const E = etiquetador(useTranslations("common.etiquetas"));
  const precio = formatoDeValor(useLocale() as AppLocale);
  const [enEdicion, setEnEdicion] = useState(false);

  if (enEdicion) {
    return (
      <EditorOportunidad
        oportunidad={oportunidad}
        equipos={equipos}
        userId={userId}
        onCerrar={() => setEnEdicion(false)}
      />
    );
  }

  const equipoAsociado =
    equipos.find((equipo) => equipo.id === oportunidad.teamId) ?? null;
  const portada = fotoDePortada(oportunidad.fotos);

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* LA MINIATURA, para que el club vea de un vistazo qué foto
              lleva cada oportunidad sin abrirla. `object-contain` y no
              `cover`: muchas fotos son carteles con texto, y recortarlas
              se come justo el texto. Sin foto no se pinta hueco. */}
          {portada && (
            <Image
              src={portada}
              alt=""
              width={192}
              height={192}
              unoptimized
              className="h-20 w-20 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 object-contain sm:h-24 sm:w-24"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-zinc-900">
                {oportunidad.title}
              </h3>
              {oportunidad.sponsorLevel !== "libre" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    CLASES_NIVEL_PATROCINIO[oportunidad.sponsorLevel]
                  }`}
                >
                  {E.nivelPatrocinio(oportunidad.sponsorLevel)}
                </span>
              )}
              {oportunidad.esNecesidad && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {t("loNecesitamos")}
                  {oportunidad.categoriaNecesidad
                    ? ` · ${E.categoriaNecesidad(oportunidad.categoriaNecesidad)}`
                    : ""}
                </span>
              )}
              {oportunidad.archivedAt && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {t("archivada")}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              {E.tipoOportunidad(oportunidad.opportunityType)}
              {oportunidad.duration ? ` · ${oportunidad.duration}` : ""}
              {equipoAsociado
                ? ` · ${equipoAsociado.sport} ${equipoAsociado.category ?? ""}`.trimEnd()
                : ""}
            </p>
            {oportunidad.exclusivity && (
              <p className="mt-1 text-xs font-medium text-accion-tinta">
                {t("enExclusiva", { sector: oportunidad.exclusivity })}
              </p>
            )}
            {oportunidad.description && (
              <p className="mt-2 text-sm text-zinc-600">
                {oportunidad.description}
              </p>
            )}

            {/* Cuando hace falta más de una empresa, el club necesita ver
              cuántas lleva sin ponerse a restar. */}
            {esPorPlazas(oportunidad) && (
              <div className="mt-3 max-w-xs">
                <BarraDePlazas
                  slotsTotal={oportunidad.slotsTotal}
                  slotsTaken={oportunidad.slotsTaken}
                  etiqueta={
                    oportunidad.esNecesidad ? "colaboradores" : "plazas"
                  }
                />
              </div>
            )}
          </div>
        </div>

        <p className="whitespace-nowrap text-lg font-bold text-teal-700">
          {precio.format(oportunidad.value)}
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
                  {E.estadoOportunidad(estadoOpcion.id)}
                </button>
              </form>
            ))}
          </div>
        )}

        {/* VER LA OPORTUNIDAD COMO LA VE UNA EMPRESA.
            El club escribe en un formulario y no tiene forma de saber
            qué sale de ahí; esto le lleva a la página de verdad.

            NO SIEMPRE SE ENSEÑA, y eso es lo importante: la página
            pública de una oportunidad necesita dos cosas, que el club
            tenga ficha (`slug`) y que la oportunidad no esté archivada
            —el listado público filtra por `archived_at is null`—. Sin
            alguna de las dos, el enlace llevaría a una página de error,
            que es peor que no tener botón. */}
        {slugDelClub && !oportunidad.archivedAt && (
          <Link
            href={`/club/${slugDelClub}/oportunidad/${oportunidad.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
          >
            {t("visualizar")}
            {/* La flecha dice que se abre en otra pestaña antes de
                pulsarla, que es cuando sirve saberlo. */}
            <span aria-hidden="true">↗</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setEnEdicion(true)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          {t("editar")}
        </button>

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
          >
            {t("duplicar")}
          </button>
        </form>

        {oportunidad.archivedAt ? (
          <form action={restaurarOportunidad}>
            <input type="hidden" name="id" value={oportunidad.id} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              {t("restaurar")}
            </button>
          </form>
        ) : (
          <form action={archivarOportunidad}>
            <input type="hidden" name="id" value={oportunidad.id} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              {t("archivar")}
            </button>
          </form>
        )}

        <AccionConConfirmacion
          accion={eliminarOportunidad}
          id={oportunidad.id}
          nombre={oportunidad.title}
          etiqueta={t("eliminar")}
          clases="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        />
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
  userId,
}: {
  oportunidad: Opportunity;
  onCerrar: () => void;
  equipos: ClubTeam[];
  userId: string;
}) {
  const t = useTranslations("panel.oportunidades");
  const [estado, formAction] = useActionState(actualizarOportunidad, null);

  return (
    <li className="rounded-xl border border-teal-200 bg-white p-6">
      <OportunidadForm
        userId={userId}
        idOportunidad={oportunidad.id}
        accion={formAction}
        estado={estado}
        mostrarEstado
        equipos={equipos}
        textoBoton={t("guardarCambios")}
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
          slotsTotal: oportunidad.slotsTotal,
          slotsTaken: oportunidad.slotsTaken,
          esNecesidad: oportunidad.esNecesidad,
          categoriaNecesidad: oportunidad.categoriaNecesidad,
          fotos: oportunidad.fotos,
          beneficios: oportunidad.beneficios,
          acciones: oportunidad.acciones,
          frecuencia: oportunidad.frecuencia,
          desde: oportunidad.desde,
          hasta: oportunidad.hasta,
          requisitos: oportunidad.requisitos,
        }}
      />
    </li>
  );
}
