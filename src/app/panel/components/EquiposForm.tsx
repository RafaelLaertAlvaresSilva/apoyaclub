"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubTeam } from "@/lib/types";
import { agregarEquipo, eliminarEquipo } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

const ETIQUETA_NIVEL: Record<ClubTeam["teamLevel"], string> = {
  primer_equipo: "Primer equipo",
  cantera: "Cantera",
};

export function EquiposForm({ equipos }: { equipos: ClubTeam[] }) {
  const [estado, formAction] = useActionState(agregarEquipo, null);

  return (
    <SeccionCard
      titulo="Equipos"
      descripcion="Añade cada equipo del club: deporte, categoría, género y si es primer equipo o cantera."
    >
      {equipos.length > 0 && (
        <ul className="mb-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {equipos.map((equipo) => (
            <li key={equipo.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-zinc-900">
                  {equipo.sport}
                  {equipo.category ? ` · ${equipo.category}` : ""}
                </p>
                <p className="text-zinc-500">
                  {ETIQUETA_NIVEL[equipo.teamLevel]}
                  {equipo.gender ? ` · ${equipo.gender}` : ""}
                  {equipo.playerCount != null ? ` · ${equipo.playerCount} jugadores` : ""}
                </p>
              </div>
              <form action={eliminarEquipo}>
                <input type="hidden" name="id" value={equipo.id} />
                <button
                  type="submit"
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* La key cambia cuando se añade un equipo (revalidatePath refresca
          `equipos`), lo que remonta el formulario y limpia sus campos. */}
      <form key={equipos.length} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Deporte *">
            <input name="sport" required placeholder="Fútbol, baloncesto…" className={clasesInput} />
          </Campo>
          <Campo etiqueta="Categoría">
            <input name="category" placeholder="Cadete, senior…" className={clasesInput} />
          </Campo>
          <Campo etiqueta="Género">
            <input name="gender" placeholder="Masculino, femenino, mixto…" className={clasesInput} />
          </Campo>
          <Campo etiqueta="Número de jugadores">
            <input name="playerCount" type="number" min={0} className={clasesInput} />
          </Campo>
        </div>

        <Campo etiqueta="Tipo de equipo">
          <select name="teamLevel" defaultValue="primer_equipo" className={clasesInput}>
            <option value="primer_equipo">Primer equipo</option>
            <option value="cantera">Cantera</option>
          </select>
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Equipo añadido." : null} />

        <BotonEnviar>Añadir equipo</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
