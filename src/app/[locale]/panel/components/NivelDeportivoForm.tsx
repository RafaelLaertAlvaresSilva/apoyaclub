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
        {/* Una por equipo, no una sola para el club. Antes había una
            única casilla y un club con equipo masculino y femenino
            tenía que elegir cuál poner: los dos son el club y los dos
            venden. Se rellena la que se tenga; el que solo tiene uno
            deja la otra vacía y no sale en ningún sitio. */}
        <fieldset className="rounded-lg border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">
            {t("maximaCategoria")}
          </legend>
          <p className="mb-3 text-xs text-zinc-500">
            La más alta en la que juega cada equipo. Rellena solo la que tengas.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Equipo masculino">
              <input
                name="topCategoryMale"
                maxLength={120}
                defaultValue={perfil?.topCategoryMale ?? ""}
                placeholder={t("ejPrimeraNacional")}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta="Equipo femenino">
              <input
                name="topCategoryFemale"
                maxLength={120}
                defaultValue={perfil?.topCategoryFemale ?? ""}
                placeholder={t("ejPrimeraNacional")}
                className={clasesInput}
              />
            </Campo>
          </div>

          {/* Lo que había antes en la casilla única. Solo se enseña si
              queda algo que no se haya repartido todavía entre las dos
              de arriba: sin esto, un club que ya la tenía rellenada
              vería su dato desaparecer sin explicación. */}
          {perfil?.topCategory && !perfil.topCategoryMale && !perfil.topCategoryFemale && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Antes tenías puesto <strong>{perfil.topCategory}</strong>. Cópialo en la casilla que
              corresponda y guarda.
            </p>
          )}
        </fieldset>
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
