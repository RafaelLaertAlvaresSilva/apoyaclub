"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarAudiencia } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

export function AudienciaForm({ perfil }: { perfil: ClubProfile | null }) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(guardarAudiencia, null);
  const seguidores = perfil?.followersByNetwork ?? {};

  return (
    <SeccionCard
      titulo={t("audiencia")}
      descripcion={t("seguidoresEnRedesAlcance")}
    >
      <form action={formAction} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">{t("seguidoresPorRed")}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta={t("instagram")}>
              <input
                name="followersInstagram"
                type="number"
                min={0}
                defaultValue={seguidores.instagram ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("facebook")}>
              <input
                name="followersFacebook"
                type="number"
                min={0}
                defaultValue={seguidores.facebook ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("xTwitter")}>
              <input
                name="followersTwitter"
                type="number"
                min={0}
                defaultValue={seguidores.twitter ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("tiktok")}>
              <input
                name="followersTiktok"
                type="number"
                min={0}
                defaultValue={seguidores.tiktok ?? ""}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("youtube")}>
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
          <Campo etiqueta={t("alcanceEstimado")} ayuda={t("personasALasQue")}>
            <input
              name="estimatedReach"
              type="number"
              min={0}
              defaultValue={perfil?.estimatedReach ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("asistenciaMediaAPartidos")}>
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

        <BotonEnviar>{t("guardarAudiencia")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
