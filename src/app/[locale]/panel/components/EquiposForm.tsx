"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubTeam } from "@/lib/types";
import { agregarEquipo, eliminarEquipo, guardarFotoEquipo } from "../actions";
import { AvisoDerechosDeImagen } from "./AvisoDerechosDeImagen";
import { ImageUploader } from "./ImageUploader";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

const ETIQUETA_NIVEL: Record<ClubTeam["teamLevel"], string> = {
  primer_equipo: "Primer equipo",
  cantera: "Cantera",
};

export function EquiposForm({ equipos, userId }: { equipos: ClubTeam[]; userId: string }) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(agregarEquipo, null);

  return (
    <SeccionCard
      titulo={t("equipos")}
      descripcion={t("anadeCadaEquipoDel")}
    >
      <div className="mb-4">
        <AvisoDerechosDeImagen />
      </div>

      {equipos.length > 0 && (
        <ul className="mb-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {equipos.map((equipo) => (
            <FilaEquipo key={equipo.id} equipo={equipo} userId={userId} etiquetaEliminar={t("eliminar")} />
          ))}
        </ul>
      )}

      {/* La key cambia cuando se añade un equipo (revalidatePath refresca
          `equipos`), lo que remonta el formulario y limpia sus campos. */}
      <form key={equipos.length} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("deporte")}>
            <input name="sport" required placeholder={t("futbolBaloncesto")} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("categoria")}>
            <input name="category" placeholder={t("cadeteSenior")} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("genero")}>
            <input name="gender" placeholder={t("masculinoFemeninoMixto")} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("numeroDeJugadores")}>
            <input name="playerCount" type="number" min={0} className={clasesInput} />
          </Campo>
        </div>

        <Campo etiqueta={t("tipoDeEquipo")}>
          <select name="teamLevel" defaultValue="primer_equipo" className={clasesInput}>
            <option value="primer_equipo">{t("primerEquipo")}</option>
            <option value="cantera">{t("cantera")}</option>
          </select>
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Equipo añadido." : null} />

        <BotonEnviar>{t("anadirEquipo")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}

/**
 * Un equipo de la lista, con su foto.
 *
 * La foto se guarda al subirla, sin pasar por el botón de guardar del
 * formulario de abajo: ese es para dar de alta un equipo nuevo, y
 * mezclar las dos cosas haría que subir una foto borrase lo que el club
 * estuviera escribiendo.
 */
function FilaEquipo({
  equipo,
  userId,
  etiquetaEliminar,
}: {
  equipo: ClubTeam;
  userId: string;
  etiquetaEliminar: string;
}) {
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [, iniciarTransicion] = useTransition();

  function guardar(url: string | null) {
    iniciarTransicion(async () => {
      const resultado = await guardarFotoEquipo(equipo.id, url);
      setErrorFoto(resultado && "error" in resultado ? (resultado.error ?? null) : null);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
      {equipo.photoUrl ? (
        <Image
          src={equipo.photoUrl}
          alt={`Foto de ${equipo.sport}`}
          width={96}
          height={64}
          className="h-16 w-24 shrink-0 rounded-lg border border-zinc-200 object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          Sin foto
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900">
          {equipo.sport}
          {equipo.category ? ` · ${equipo.category}` : ""}
        </p>
        <p className="text-zinc-500">
          {ETIQUETA_NIVEL[equipo.teamLevel]}
          {equipo.gender ? ` · ${equipo.gender}` : ""}
          {equipo.playerCount != null ? ` · ${equipo.playerCount} jugadores` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ImageUploader
            userId={userId}
            carpeta="equipos"
            label={equipo.photoUrl ? "Cambiar foto" : "Subir foto"}
            onSubido={async (url) => guardar(url)}
          />
          {equipo.photoUrl && (
            <button
              type="button"
              onClick={() => guardar(null)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              Quitar foto
            </button>
          )}
        </div>

        {errorFoto && <p className="mt-2 text-xs text-red-700">{errorFoto}</p>}
      </div>

      <form action={eliminarEquipo}>
        <input type="hidden" name="id" value={equipo.id} />
        <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
          {etiquetaEliminar}
        </button>
      </form>
    </li>
  );
}
