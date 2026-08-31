"use client";

import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile, Milestone } from "@/lib/types";
import { guardarHistoria } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

export function HistoriaForm({ perfil }: { perfil: ClubProfile | null }) {
  const [estado, formAction] = useActionState(guardarHistoria, null);
  const [hitos, setHitos] = useState<Milestone[]>(perfil?.milestones ?? []);
  const [anioNuevo, setAnioNuevo] = useState("");
  const [textoNuevo, setTextoNuevo] = useState("");

  function anadirHito() {
    const anio = Number.parseInt(anioNuevo, 10);
    if (!Number.isFinite(anio) || !textoNuevo.trim()) return;
    setHitos((actuales) => [...actuales, { year: anio, text: textoNuevo.trim() }]);
    setAnioNuevo("");
    setTextoNuevo("");
  }

  function quitarHito(indice: number) {
    setHitos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <SeccionCard titulo="Historia" descripcion="Fundación e hitos destacados de la trayectoria del club.">
      <form action={formAction} className="space-y-4">
        <Campo etiqueta="Año de fundación">
          <input
            name="foundingYear"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            defaultValue={perfil?.foundingYear ?? ""}
            className={clasesInput}
          />
        </Campo>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Hitos</p>

          {hitos.length > 0 && (
            <ul className="mb-3 space-y-2">
              {hitos
                .slice()
                .sort((a, b) => a.year - b.year)
                .map((hito, indice) => (
                  <li
                    key={`${hito.year}-${indice}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium text-zinc-900">{hito.year}</span>{" "}
                      <span className="text-zinc-600">{hito.text}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarHito(indice)}
                      className="shrink-0 text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
            </ul>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-24">
              <input
                type="number"
                placeholder="Año"
                value={anioNuevo}
                onChange={(evento) => setAnioNuevo(evento.target.value)}
                className={clasesInput}
              />
            </div>
            <div className="flex-1 min-w-48">
              <input
                type="text"
                placeholder="Descripción del hito"
                value={textoNuevo}
                onChange={(evento) => setTextoNuevo(evento.target.value)}
                className={clasesInput}
              />
            </div>
            <button
              type="button"
              onClick={anadirHito}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Añadir hito
            </button>
          </div>
        </div>

        <input type="hidden" name="milestones" value={JSON.stringify(hitos)} />

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar historia</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
