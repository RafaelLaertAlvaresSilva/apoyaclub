"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarNivelDeportivo } from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

export function NivelDeportivoForm({ perfil }: { perfil: ClubProfile | null }) {
  const [estado, formAction] = useActionState(guardarNivelDeportivo, null);

  return (
    <SeccionCard
      titulo="Nivel deportivo"
      descripcion="La categoría, competiciones y logros ayudan a la empresa a valorar la visibilidad del patrocinio."
    >
      <form action={formAction} className="space-y-4">
        <Campo etiqueta="Máxima categoría">
          <input
            name="topCategory"
            defaultValue={perfil?.topCategory ?? ""}
            placeholder="Ej. Primera Nacional"
            className={clasesInput}
          />
        </Campo>
        <Campo etiqueta="Competiciones">
          <textarea
            name="competitions"
            defaultValue={perfil?.competitions ?? ""}
            placeholder="Competiciones en las que participa el club"
            className={clasesTextarea}
          />
        </Campo>
        <Campo etiqueta="Logros">
          <textarea
            name="achievements"
            defaultValue={perfil?.achievements ?? ""}
            placeholder="Títulos, ascensos, hitos deportivos…"
            className={clasesTextarea}
          />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar nivel deportivo</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
