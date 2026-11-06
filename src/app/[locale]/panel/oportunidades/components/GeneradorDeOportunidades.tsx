"use client";

import { useTranslations } from "next-intl";
import { useActionState, useMemo, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { IconoDeCategoria } from "@/components/IconoDeCategoria";
import { usePaisDelClub } from "@/components/PaisDelClub";
import { simboloDeMoneda } from "@/lib/format";
import type { RequisitoIdea } from "@/lib/catalogo-ideas";
import {
  categoriasDelGenerador,
  generarPropuestas,
  type EleccionDelGenerador,
  type Propuesta,
} from "@/lib/generador-oportunidades";
import type { CategoriaNecesidad, ClubProfile, ClubTeam } from "@/lib/types";
import { clasesInput, clasesTextarea } from "../../components/SeccionCard";
import { publicarPropuestas, type EstadoGuardado } from "../actions";

/**
 * "Generar mis oportunidades" (`lib/generador-oportunidades.ts`).
 *
 * Cerrado, es una invitación con un botón. Al pulsarlo pregunta de qué
 * categoría (o "un poco de todo"); elegida, enseña todas las propuestas
 * en una sola pantalla: el club desmarca las que no quiere,
 * retoca lo que quiera, pone precio si quiere, y publica las marcadas de
 * una vez. Nada se publica sin que el club lo haya visto.
 *
 * Sin precio sale "precio a convenir" (decidido por Rafael: primero sin
 * precio; el de referencia de otros clubes, más adelante).
 */
export function GeneradorDeOportunidades({
  perfil,
  equipos,
  requisitos,
  existentes,
  lineaDeDatos,
}: {
  perfil: Pick<ClubProfile, "topCategoryMalePhoto" | "topCategoryFemalePhoto">;
  equipos: ClubTeam[];
  requisitos: RequisitoIdea[];
  existentes: { title: string; ideaId: string | null; esNecesidad: boolean; categoriaNecesidad: CategoriaNecesidad | null }[];
  lineaDeDatos: string | null;
}) {
  const t = useTranslations("panel.oportunidades.generador");
  const tIdeas = useTranslations("ideas");
  const tPerfil = useTranslations("panel.perfil");
  const tCategorias = useTranslations("home.categoriasIdea");
  const [paso, setPaso] = useState<"cerrado" | "categoria" | "revisar">("cerrado");
  const [eleccion, setEleccion] = useState<EleccionDelGenerador>("mezcla");

  // Las propuestas de cada opción, para saber cuántas hay en cada una y
  // no ofrecer categorías que no darían ninguna.
  const porEleccion = useMemo(() => {
    const sexos = ["Masculino", "Femenino", "Mixto"];
    const generar = (opcion: EleccionDelGenerador) =>
      generarPropuestas({
        perfil,
        equipos,
        requisitos: new Set(requisitos),
        existentes,
        tIdeas: (clave) => tIdeas(clave),
        nombreDelEquipo: (equipo) =>
          [equipo.category, equipo.gender && sexos.includes(equipo.gender) ? tPerfil(`sexo.${equipo.gender}`) : equipo.gender]
            .filter(Boolean)
            .join(" "),
        lineaDeDatos,
        eleccion: opcion,
      });
    const opciones: EleccionDelGenerador[] = ["mezcla", ...categoriasDelGenerador(equipos)];
    return new Map(opciones.map((opcion) => [opcion, generar(opcion)]));
  }, [perfil, equipos, requisitos, existentes, lineaDeDatos, tIdeas, tPerfil]);

  const hayAlguna = [...porEleccion.values()].some((lista) => lista.length > 0);

  if (paso === "cerrado") {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <p className="font-semibold text-teal-950">{t("titulo")}</p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-teal-900">{hayAlguna ? t("texto") : t("ninguna")}</p>
        {hayAlguna && (
          <button
            type="button"
            onClick={() => setPaso("categoria")}
            className="mt-3 rounded-lg bg-accion px-4 py-2.5 text-sm font-medium text-sobre-color transition-colors hover:bg-accion-fuerte"
          >
            {t("boton")}
          </button>
        )}
      </div>
    );
  }

  if (paso === "categoria") {
    const conAlguna = categoriasDelGenerador(equipos).filter((categoria) => (porEleccion.get(categoria)?.length ?? 0) > 0);
    const pastilla =
      "flex w-full min-w-0 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-teal-500 hover:text-teal-700";
    const elegir = (opcion: EleccionDelGenerador) => {
      setEleccion(opcion);
      setPaso("revisar");
    };
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <p className="font-semibold text-teal-950">{t("queCategoria")}</p>
        <p className="mt-1 text-sm text-teal-900">{t("queCategoriaTexto")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {(porEleccion.get("mezcla")?.length ?? 0) > 0 && (
            <button type="button" onClick={() => elegir("mezcla")} className={`${pastilla} border-teal-400 text-teal-800`}>
              <span aria-hidden="true">✦</span>
              {t("mezcla")}
            </button>
          )}
          {conAlguna.map((categoria) => (
            <button key={categoria} type="button" onClick={() => elegir(categoria)} className={pastilla}>
              <IconoDeCategoria categoria={categoria} className="h-4 w-4 flex-none" />
              <span className="min-w-0 break-words">
                {tCategorias(`${categoria}.etiqueta`)}{" "}
                <span className="text-xs font-normal text-zinc-500">({porEleccion.get(categoria)?.length})</span>
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaso("cerrado")}
          className="mt-3 text-sm font-medium text-zinc-600 hover:underline"
        >
          {t("cancelar")}
        </button>
      </div>
    );
  }

  return (
    <RevisarPropuestas
      // Una revisión nueva por categoría: lo marcado en otra no se arrastra.
      key={eleccion}
      propuestas={porEleccion.get(eleccion) ?? []}
      onCambiarCategoria={() => setPaso("categoria")}
      onCancelar={() => setPaso("cerrado")}
    />
  );
}

/** Las propuestas de la categoría elegida, para revisar y publicar. */
function RevisarPropuestas({
  propuestas,
  onCambiarCategoria,
  onCancelar,
}: {
  propuestas: Propuesta[];
  onCambiarCategoria: () => void;
  onCancelar: () => void;
}) {
  const t = useTranslations("panel.oportunidades.generador");
  const paisDelClub = usePaisDelClub();
  const [estado, accion] = useActionState<EstadoGuardado, FormData>(publicarPropuestas, null);
  const [marcadas, setMarcadas] = useState<Set<number>>(
    () => new Set(propuestas.flatMap((propuesta, indice) => (propuesta.marcada ? [indice] : []))),
  );
  const [sinFoto, setSinFoto] = useState<Set<number>>(new Set());

  if (estado?.ok) {
    return <AvisoExito mensaje={t("publicadas")} />;
  }

  const cambiar = (conjunto: Set<number>, indice: number, poner: boolean) => {
    const nuevo = new Set(conjunto);
    if (poner) nuevo.add(indice);
    else nuevo.delete(indice);
    return nuevo;
  };

  return (
    <form action={accion} className="flex flex-col gap-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
      <div>
        <p className="font-semibold text-teal-950">{t("tituloRevision")}</p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-teal-900">{t("revisa")}</p>
      </div>

      {propuestas.map((propuesta, indice) => {
        const marcada = marcadas.has(indice);
        const foto = sinFoto.has(indice) ? null : propuesta.fotos[0];
        return (
          <div
            key={propuesta.ideaId}
            className={`rounded-xl border bg-white p-4 transition-opacity ${
              marcada ? "border-teal-300" : "border-zinc-200 opacity-60"
            }`}
          >
            <input type="hidden" name={`idea_${indice}`} value={propuesta.ideaId} />
            <input type="hidden" name={`team_${indice}`} value={propuesta.teamId ?? ""} />
            {foto && <input type="hidden" name={`fotos_${indice}`} value={foto} />}

            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-900">
              <input
                type="checkbox"
                name="seleccion"
                value={indice}
                checked={marcada}
                onChange={(evento) => setMarcadas((antes) => cambiar(antes, indice, evento.target.checked))}
                className="rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
              />
              {propuesta.esNecesidad ? t("necesidadEtiqueta") : t("ofertaEtiqueta")}
            </label>

            {/* Cerrada mientras no está marcada: lo que no se va a
                publicar no tiene por qué ocupar la pantalla. */}
            {marcada ? (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                {foto && (
                  <div className="shrink-0 sm:w-36">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de una foto ya subida */}
                    <img src={foto} alt="" className="h-28 w-full rounded-lg object-cover sm:h-36" />
                    <button
                      type="button"
                      onClick={() => setSinFoto((antes) => cambiar(antes, indice, true))}
                      className="mt-1 text-xs font-medium text-zinc-500 hover:text-red-600"
                    >
                      {t("quitarFoto")}
                    </button>
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-600">
                    {t("campoTitulo")}
                    <input name={`title_${indice}`} defaultValue={propuesta.title} required className={`${clasesInput} mt-1`} />
                  </label>
                  <label className="text-xs font-medium text-zinc-600">
                    {t("campoTexto")}
                    <textarea
                      name={`description_${indice}`}
                      defaultValue={propuesta.description}
                      rows={6}
                      className={`${clasesTextarea} mt-1`}
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-medium text-zinc-600">
                      {t("campoDuracion")}
                      <input name={`duration_${indice}`} defaultValue={propuesta.duration} className={`${clasesInput} mt-1`} />
                    </label>
                    {propuesta.esNecesidad ? (
                      <p className="self-end pb-2 text-sm font-medium text-teal-700">{t("necesidadPrecio")}</p>
                    ) : (
                      <label className="text-xs font-medium text-zinc-600">
                        {t("campoPrecio")} ({simboloDeMoneda(paisDelClub)})
                        <input
                          name={`value_${indice}`}
                          inputMode="decimal"
                          placeholder={t("precioPlaceholder")}
                          className={`${clasesInput} mt-1`}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-zinc-600">{propuesta.title}</p>
            )}
          </div>
        );
      })}

      <AvisoError mensaje={estado?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <BotonEnviar>{t("publicar", { n: marcadas.size })}</BotonEnviar>
        <button
          type="button"
          onClick={onCambiarCategoria}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t("otraCategoria")}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm font-medium text-zinc-600 hover:underline">
          {t("cancelar")}
        </button>
      </div>
    </form>
  );
}
