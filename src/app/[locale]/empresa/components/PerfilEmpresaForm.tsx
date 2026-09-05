"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import Image from "next/image";
import { ImageUploader } from "@/app/[locale]/panel/components/ImageUploader";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import {
  Campo,
  SeccionCard,
  clasesInput,
  clasesTextarea,
} from "@/app/[locale]/panel/components/SeccionCard";
import { OBJETIVOS_OPORTUNIDAD } from "@/lib/opportunities";
import type { CompanyProfile } from "@/lib/types";
import { guardarPerfilEmpresa } from "../actions";

export function PerfilEmpresaForm({
  perfil,
  userId,
}: {
  perfil: CompanyProfile | null;
  userId: string;
}) {
  const t = useTranslations("empresa.perfil");
  const [estado, formAction] = useActionState(guardarPerfilEmpresa, null);
  const [logoUrl, setLogoUrl] = useState(perfil?.logoUrl ?? "");

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
          <Campo etiqueta="Provincia" ayuda="Es por lo que te filtran los clubes de tu zona.">
            <input name="province" defaultValue={perfil?.province ?? ""} className={clasesInput} />
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
          <p className="mb-2 text-xs text-zinc-500">{t("unRangoAproximadoEn")}</p>
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
          <p className="mb-2 text-xs text-zinc-500">{t("aQuePublicoU")}</p>
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

        {/* El directorio (migración 0033). Va apagado por defecto: la
            empresa se registró para buscar clubes, no para salir en una
            lista, y publicarla sin preguntar sería usarla. */}
        <fieldset className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <legend className="px-1 text-sm font-semibold text-teal-900">
            Aparecer en el directorio de empresas
          </legend>

          <label className="flex items-start gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              name="openToSponsor"
              defaultChecked={perfil?.openToSponsor ?? false}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />
            <span>
              <span className="font-medium">Quiero que los clubes puedan encontrarme</span>
              <span className="mt-0.5 block text-xs text-zinc-600">
                Sales en la lista pública de empresas abiertas a patrocinar y los clubes te
                escriben desde ahí. Dejas de buscar tú.
              </span>
            </span>
          </label>

          <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-zinc-600">
            Se publican tu nombre, sector, localidad, web, la presentación y lo que quieres apoyar.
            <strong className="font-medium"> Tu correo no se publica nunca</strong>, y del
            presupuesto solo se enseña una franja (&laquo;entre 500 y 2.000 €&raquo;), no la cifra:
            si saliera el número, todos los clubes pedirían justo el máximo. Cada club solo puede
            escribirte una vez.
          </p>

          <div className="mt-4 space-y-4">
            <Campo
              etiqueta="Presentación (opcional)"
              ayuda="Dos o tres líneas: a qué os dedicáis y qué tipo de club os gustaría apoyar. Máximo 600 caracteres."
            >
              <textarea
                name="description"
                maxLength={600}
                rows={4}
                defaultValue={perfil?.description ?? ""}
                placeholder="Ferretería de barrio desde 1987. Nos gustaría apoyar a un club de la zona, sobre todo si tiene cantera."
                className={clasesTextarea}
              />
            </Campo>

            <div>
              <p className="mb-1 text-sm font-medium text-zinc-700">Logotipo (opcional)</p>
              <input type="hidden" name="logoUrl" value={logoUrl} />
              {logoUrl && (
                <div className="mb-2 h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1">
                  <Image
                    src={logoUrl}
                    alt="Logotipo de tu empresa"
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <ImageUploader
                userId={userId}
                carpeta="logo-empresa"
                label={logoUrl ? "Cambiar logotipo" : "Subir logotipo"}
                onSubido={async (url) => setLogoUrl(url)}
              />
            </div>
          </div>
        </fieldset>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarPerfil")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
