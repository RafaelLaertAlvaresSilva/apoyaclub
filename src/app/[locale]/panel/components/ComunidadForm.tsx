"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile, CommunityAction } from "@/lib/types";
import { guardarComunidad } from "../actions";
import { SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

export function ComunidadForm({ perfil }: { perfil: ClubProfile | null }) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(guardarComunidad, null);
  const [acciones, setAcciones] = useState<CommunityAction[]>(perfil?.communityActions ?? []);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [descripcionNueva, setDescripcionNueva] = useState("");

  function anadirAccion() {
    if (!tituloNuevo.trim()) return;
    setAcciones((actuales) => [
      ...actuales,
      { title: tituloNuevo.trim(), description: descripcionNueva.trim() },
    ]);
    setTituloNuevo("");
    setDescripcionNueva("");
  }

  function quitarAccion(indice: number) {
    setAcciones((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <SeccionCard
      titulo={t("comunidad")}
      descripcion={t("accionesSocialesEducativasO")}
    >
      <form action={formAction} className="space-y-4">
        {acciones.length > 0 && (
          <ul className="space-y-2">
            {acciones.map((accion, indice) => (
              <li
                key={`${accion.title}-${indice}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-zinc-900">{accion.title}</span>
                  {accion.description && <span className="text-zinc-600"> — {accion.description}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => quitarAccion(indice)}
                  className="shrink-0 text-red-600 hover:underline"
                >{t("quitar")}</button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-3">
          <input
            type="text"
            placeholder={t("tituloDeLaAccion")}
            value={tituloNuevo}
            onChange={(evento) => setTituloNuevo(evento.target.value)}
            className={clasesInput}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcionNueva}
            onChange={(evento) => setDescripcionNueva(evento.target.value)}
            className={clasesTextarea}
          />
          <button
            type="button"
            onClick={anadirAccion}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >{t("anadirAccion")}</button>
        </div>

        <input type="hidden" name="communityActions" value={JSON.stringify(acciones)} />

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarComunidad")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
