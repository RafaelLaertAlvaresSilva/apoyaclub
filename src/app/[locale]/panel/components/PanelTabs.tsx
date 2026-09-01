"use client";

import { useState } from "react";
import type { ClubProfile, ClubSponsor, ClubTeam } from "@/lib/types";
import { AudienciaForm } from "./AudienciaForm";
import { CanteraForm } from "./CanteraForm";
import { ComunidadForm } from "./ComunidadForm";
import { EquiposForm } from "./EquiposForm";
import { HistoriaForm } from "./HistoriaForm";
import { IdentidadForm } from "./IdentidadForm";
import { NivelDeportivoForm } from "./NivelDeportivoForm";
import { PatrocinadoresForm } from "./PatrocinadoresForm";

type Pestana =
  | "identidad"
  | "nivel"
  | "equipos"
  | "cantera"
  | "historia"
  | "audiencia"
  | "comunidad"
  | "patrocinadores";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "identidad", etiqueta: "Identidad" },
  { id: "nivel", etiqueta: "Nivel deportivo" },
  { id: "equipos", etiqueta: "Equipos" },
  { id: "cantera", etiqueta: "Cantera" },
  { id: "historia", etiqueta: "Historia" },
  { id: "audiencia", etiqueta: "Audiencia" },
  { id: "comunidad", etiqueta: "Comunidad" },
  { id: "patrocinadores", etiqueta: "Patrocinadores" },
];

export function PanelTabs({
  userId,
  perfil,
  equipos,
  patrocinadores,
}: {
  userId: string;
  perfil: ClubProfile | null;
  equipos: ClubTeam[];
  patrocinadores: ClubSponsor[];
}) {
  const [pestanaActiva, setPestanaActiva] = useState<Pestana>("identidad");

  // Hasta que no exista el club (nombre + localidad guardados), solo se
  // puede rellenar la Identidad: el resto de secciones dependen de esa
  // fila para poder guardarse.
  const perfilCreado = perfil !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {PESTANAS.map((pestana) => {
          const bloqueada = pestana.id !== "identidad" && !perfilCreado;
          return (
            <button
              key={pestana.id}
              type="button"
              disabled={bloqueada}
              onClick={() => setPestanaActiva(pestana.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                pestanaActiva === pestana.id
                  ? "bg-teal-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {pestana.etiqueta}
            </button>
          );
        })}
      </nav>

      <div>
        {!perfilCreado && (
          <p className="mb-4 text-sm text-zinc-500">
            Completa la identidad del club (nombre y localidad) para desbloquear el resto de
            secciones.
          </p>
        )}

        {pestanaActiva === "identidad" && <IdentidadForm userId={userId} perfil={perfil} />}
        {pestanaActiva === "nivel" && perfilCreado && <NivelDeportivoForm perfil={perfil} />}
        {pestanaActiva === "equipos" && perfilCreado && <EquiposForm equipos={equipos} />}
        {pestanaActiva === "cantera" && perfilCreado && <CanteraForm perfil={perfil} />}
        {pestanaActiva === "historia" && perfilCreado && <HistoriaForm perfil={perfil} />}
        {pestanaActiva === "audiencia" && perfilCreado && <AudienciaForm perfil={perfil} />}
        {pestanaActiva === "comunidad" && perfilCreado && <ComunidadForm perfil={perfil} />}
        {pestanaActiva === "patrocinadores" && perfilCreado && (
          <PatrocinadoresForm userId={userId} patrocinadores={patrocinadores} />
        )}
      </div>
    </div>
  );
}
