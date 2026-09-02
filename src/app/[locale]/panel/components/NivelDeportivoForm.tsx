"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarNivelDeportivo } from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

export function NivelDeportivoForm({ perfil }: { perfil: ClubProfile | null }) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarNivelDeportivo, null);

  return (
    <SeccionCard
      titulo={t("nivelDeportivo")}
      descripcion={t("laCategoriaCompeticionesY")}
    >
      <form action={formAction} className="space-y-4">
        <Campo etiqueta={t("maximaCategoria")}>
          <input
            name="topCategory"
            defaultValue={perfil?.topCategory ?? ""}
            placeholder={t("ejPrimeraNacional")}
            className={clasesInput}
          />
        </Campo>
        <Campo etiqueta={t("competiciones")}>
          <textarea
            name="competitions"
            defaultValue={perfil?.competitions ?? ""}
            placeholder={t("competicionesEnLasQue")}
            className={clasesTextarea}
          />
        </Campo>
        <Campo etiqueta={t("logros")}>
          <textarea
            name="achievements"
            defaultValue={perfil?.achievements ?? ""}
            placeholder={t("titulosAscensosHitosDeportivos")}
            className={clasesTextarea}
          />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarNivelDeportivo")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
