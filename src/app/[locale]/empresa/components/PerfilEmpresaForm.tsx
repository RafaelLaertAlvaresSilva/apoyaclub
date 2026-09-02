"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import { Campo, SeccionCard, clasesInput } from "@/app/[locale]/panel/components/SeccionCard";
import { OBJETIVOS_OPORTUNIDAD } from "@/lib/opportunities";
import type { CompanyProfile } from "@/lib/types";
import { guardarPerfilEmpresa } from "../actions";

export function PerfilEmpresaForm({ perfil }: { perfil: CompanyProfile | null }) {
  const t = useTranslations("empresa.perfil");
  const [estado, formAction] = useActionState(guardarPerfilEmpresa, null);

  return (
    <SeccionCard
      titulo={t("perfilDeEmpresa")}
      descripcion={t("comoTePresentasA")}
    >
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("nombreDeLaEmpresa")}>
            <input name="name" defaultValue={perfil?.name ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("sector")}>
            <input
              name="sector"
              defaultValue={perfil?.sector ?? ""}
              placeholder={t("ejAlimentacionConstruccionTecnologia")}
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("localidad")}>
            <input name="city" defaultValue={perfil?.city ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("web")}>
            <input
              name="website"
              type="url"
              defaultValue={perfil?.website ?? ""}
              placeholder="https://"
              className={clasesInput}
            />
          </Campo>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-zinc-700">{t("presupuestoOrientativo")}</legend>
          <p className="mb-2 text-xs text-zinc-400">{t("unRangoAproximadoEn")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="budgetMin"
              type="number"
              min={0}
              step="0.01"
              defaultValue={perfil?.budgetMin ?? ""}
              aria-label={t("presupuestoDesde")}
              placeholder={t("presupuestoDesde")}
              className={clasesInput}
            />
            <input
              name="budgetMax"
              type="number"
              min={0}
              step="0.01"
              defaultValue={perfil?.budgetMax ?? ""}
              aria-label={t("presupuestoHasta")}
              placeholder={t("presupuestoHasta")}
              className={clasesInput}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-zinc-700">{t("objetivosDePatrocinio")}</legend>
          <p className="mb-2 text-xs text-zinc-400">{t("aQuePublicoU")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {OBJETIVOS_OPORTUNIDAD.map((objetivo) => (
              <label key={objetivo.id} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="objectives"
                  value={objetivo.id}
                  defaultChecked={perfil?.objectives.includes(objetivo.id) ?? false}
                  className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                />
                {objetivo.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarPerfil")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
