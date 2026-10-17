"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ContactoEmpresa } from "@/lib/empresas";
import { ImageUploader } from "../../panel/components/ImageUploader";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "../../panel/components/SeccionCard";
import { CamposDeContacto } from "../components/CamposDeContacto";
import { guardarFichaEmpresa } from "../actions";

export type DatosFicha = {
  nombre: string;
  sector: string;
  localidad: string;
  provincia: string;
  web: string;
  descripcion: string;
  enElDirectorio: boolean;
  quiereAvisos: boolean;
  logoUrl: string | null;
  contacto: ContactoEmpresa;
};

/**
 * La ficha que ve un club.
 *
 * Todo opcional menos el nombre. La empresa se registró para ofrecer
 * algo, no para rellenar un perfil: exigirle sector, provincia y
 * descripción antes de dejarla hacer nada es la forma más rápida de que
 * cierre la pestaña.
 */
export function FichaForm({ datos, userId }: { datos: DatosFicha; userId: string }) {
  const t = useTranslations("empresa.panel");
  const [estado, formAction] = useActionState(guardarFichaEmpresa, null);

  // El logo viaja en un campo oculto, igual que en el panel del club:
  // se sube antes de guardar y lo que se manda es la dirección ya
  // subida, no el archivo.
  const [logoUrl, setLogoUrl] = useState(datos.logoUrl ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SeccionCard titulo={t("empresa")} descripcion={t("veClubAntesEscribirte")}>
        <div className="flex flex-col gap-4">
          {/* Lo primero que ve un club en el directorio. Una ficha sin
              logo se lee como una empresa a medio hacer. */}
          <Campo etiqueta={t("logo")} grupo ayuda={t("cuadradoVeMejorPuedes")}>
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <div className="flex flex-wrap items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={t("logoEmpresa")}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg border border-zinc-200 bg-white object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
                  {t("sinLogo")}
                </div>
              )}

              <ImageUploader
                userId={userId}
                carpeta="logo-empresa"
                label={logoUrl ? t("cambiarLogo") : t("subirLogo")}
                onSubido={(url) => setLogoUrl(url)}
              />

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  {t("quitar")}
                </button>
              )}
            </div>
          </Campo>

          <Campo etiqueta={t("nombre")}>
            <input
              name="nombre"
              required
              maxLength={150}
              defaultValue={datos.nombre}
              className={clasesInput}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={t("sector")} ayuda={t("osDedicaisDosPalabras")}>
              <input
                name="sector"
                maxLength={100}
                defaultValue={datos.sector}
                placeholder={t("clinicaFisioterapia")}
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta={t("web")}>
              <input
                name="web"
                type="url"
                maxLength={200}
                defaultValue={datos.web}
                placeholder="https://…"
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta={t("localidad")}>
              <input
                name="localidad"
                maxLength={100}
                defaultValue={datos.localidad}
                placeholder={t("benidorm")}
                className={clasesInput}
              />
            </Campo>

            <Campo etiqueta={t("provincia")}>
              <input
                name="provincia"
                maxLength={80}
                defaultValue={datos.provincia}
                placeholder={t("alicante")}
                className={clasesInput}
              />
            </Campo>
          </div>

          <Campo
            etiqueta={t("presentacion")}
            ayuda={t("maximo600CaracteresQuien")}
          >
            <textarea
              name="descripcion"
              maxLength={600}
              defaultValue={datos.descripcion}
              className={clasesTextarea}
            />
          </Campo>
        </div>
      </SeccionCard>

      <SeccionCard
        titulo={t("contacto")}
        descripcion={t("comoTeEscribenClubes")}
      >
        <CamposDeContacto contacto={datos.contacto} />
      </SeccionCard>

      <SeccionCard
        titulo={t("salirDirectorio")}
        descripcion={t("listadoPublicoEmpresasClubes")}
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="enElDirectorio"
            defaultChecked={datos.enElDirectorio}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
          />
          <span>
            <span className="block font-medium text-zinc-900">
              {t("quieroAparecerClubesMe")}
            </span>
            <span className="mt-1 block text-zinc-500">
              {t("siPublicasOfertaEsto")}
            </span>
          </span>
        </label>
      </SeccionCard>

      <SeccionCard
        titulo={t("avisosCorreo")}
        descripcion={t("haceNoTengasEstar")}
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="quiereAvisos"
            defaultChecked={datos.quiereAvisos}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-accion-tinta"
          />
          <span>
            <span className="block font-medium text-zinc-900">
              {t("avisameCuandoClubBusque")}
            </span>
            <span className="mt-1 block text-zinc-500">
              {t("correoComoMuchoDia")}
            </span>
          </span>
        </label>
      </SeccionCard>

      <AvisoError mensaje={estado?.error} />
      <AvisoExito mensaje={estado?.ok ? t("guardado") : null} />

      <BotonEnviar>{t("guardarFicha")}</BotonEnviar>
    </form>
  );
}
