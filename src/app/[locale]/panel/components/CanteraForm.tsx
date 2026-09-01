"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarCantera } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

export function CanteraForm({ perfil }: { perfil: ClubProfile | null }) {
  const [estado, formAction] = useActionState(guardarCantera, null);

  return (
    <SeccionCard
      titulo="Cantera"
      descripcion="Solo datos agregados: no hace falta detallar cada equipo, basta con los totales."
    >
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Equipos de cantera">
            <input
              name="youthTeamsCount"
              type="number"
              min={0}
              defaultValue={perfil?.youthTeamsCount ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta="Jugadores">
            <input
              name="youthPlayersCount"
              type="number"
              min={0}
              defaultValue={perfil?.youthPlayersCount ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta="Familias">
            <input
              name="youthFamiliesCount"
              type="number"
              min={0}
              defaultValue={perfil?.youthFamiliesCount ?? ""}
              className={clasesInput}
            />
          </Campo>
        </div>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar cantera</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
