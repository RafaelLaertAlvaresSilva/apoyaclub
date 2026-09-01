"use client";

import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarAudiencia } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

export function AudienciaForm({ perfil }: { perfil: ClubProfile | null }) {
  const [estado, formAction] = useActionState(guardarAudiencia, null);
  const seguidores = perfil?.followersByNetwork ?? {};

  return (
    <SeccionCard
      titulo="Audiencia"
      descripcion="Seguidores en redes, alcance estimado y asistencia media a los partidos."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Seguidores por red</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Instagram">
              <input
                name="followersInstagram"
                type="number"
                min={0}
                defaultValue={seguidores.instagram ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="Facebook">
              <input
                name="followersFacebook"
                type="number"
                min={0}
                defaultValue={seguidores.facebook ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="X / Twitter">
              <input
                name="followersTwitter"
                type="number"
                min={0}
                defaultValue={seguidores.twitter ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="TikTok">
              <input
                name="followersTiktok"
                type="number"
                min={0}
                defaultValue={seguidores.tiktok ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="YouTube">
              <input
                name="followersYoutube"
                type="number"
                min={0}
                defaultValue={seguidores.youtube ?? ""}
                className={clasesInput}
              />
            </Campo>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Alcance estimado" ayuda="Personas a las que llega la comunicación del club.">
            <input
              name="estimatedReach"
              type="number"
              min={0}
              defaultValue={perfil?.estimatedReach ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta="Asistencia media a partidos">
            <input
              name="averageAttendance"
              type="number"
              min={0}
              defaultValue={perfil?.averageAttendance ?? ""}
              className={clasesInput}
            />
          </Campo>
        </div>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar audiencia</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
