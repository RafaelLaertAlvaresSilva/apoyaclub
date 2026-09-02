"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarCantera } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";

export function CanteraForm({ perfil }: { perfil: ClubProfile | null }) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarCantera, null);

  return (
    <SeccionCard
      titulo={t("cantera")}
      descripcion={t("soloDatosAgregadosNo")}
    >
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta={t("equiposDeCantera")}>
            <input
              name="youthTeamsCount"
              type="number"
              min={0}
              defaultValue={perfil?.youthTeamsCount ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("jugadores")}>
            <input
              name="youthPlayersCount"
              type="number"
              min={0}
              defaultValue={perfil?.youthPlayersCount ?? ""}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("familias")}>
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

        <BotonEnviar>{t("guardarCantera")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
