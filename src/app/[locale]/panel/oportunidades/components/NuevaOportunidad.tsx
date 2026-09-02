"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { ClubTeam, OpportunityType } from "@/lib/types";
import type { PlantillasPorTipo } from "@/lib/opportunity-templates";
import type { PlantillaOportunidad } from "@/lib/opportunities";
import { crearOportunidad } from "../actions";
import { OportunidadForm } from "./OportunidadForm";
import { PlantillasRapidas } from "./PlantillasRapidas";

export function NuevaOportunidad({
  equipos = [],
  plantillas,
}: {
  equipos?: ClubTeam[];
  plantillas?: PlantillasPorTipo;
}) {
  const t = useTranslations("panel.oportunidades");
  const [abierto, setAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState<{ tipo: OpportunityType; datos: PlantillaOportunidad } | null>(
    null,
  );
  const [estado, formAction] = useActionState(crearOportunidad, null);

  // Al crearse con éxito, el padre vuelve a pasar `oportunidades` con
  // una fila más; su `key={oportunidades.length}` cambia y remonta este
  // componente ya cerrado, sin necesidad de cerrarlo manualmente aquí.
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
      >{t("nuevaOportunidad")}</button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">{t("nuevaOportunidad2")}</h2>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-zinc-500 hover:underline"
        >{t("cerrar")}</button>
      </div>

      <PlantillasRapidas plantillas={plantillas} onElegir={(tipo, datos) => setPlantilla({ tipo, datos })} />

      <OportunidadForm
        key={plantilla ? `${plantilla.tipo}-${plantilla.datos.title}` : "en-blanco"}
        accion={formAction}
        estado={estado}
        equipos={equipos}
        textoBoton="Crear oportunidad"
        valoresIniciales={
          plantilla
            ? { title: plantilla.datos.title, description: plantilla.datos.description, opportunityType: plantilla.tipo }
            : undefined
        }
      />
    </div>
  );
}
