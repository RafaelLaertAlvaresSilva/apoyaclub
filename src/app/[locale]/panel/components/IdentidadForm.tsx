"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import {
  agregarFoto,
  eliminarFoto,
  guardarIdentidad,
  guardarLogo,
  registrarConfirmacionMenores,
} from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";

export function IdentidadForm({
  userId,
  perfil,
}: {
  userId: string;
  perfil: ClubProfile | null;
}) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarIdentidad, null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [confirmaSinMenores, setConfirmaSinMenores] = useState(false);
  const [, iniciarTransicion] = useTransition();

  const fotos = perfil?.photoUrls ?? [];

  function manejarErrorAccion(resultado: { error: string } | { ok: true } | null) {
    if (resultado && "error" in resultado) setErrorImagen(resultado.error);
  }

  return (
    <SeccionCard
      titulo={t("identidad")}
      descripcion={t("comoSePresentaTu")}
    >
      {perfil?.slug && (
        <p className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Tu página pública ya está en{" "}
          <a href={`/club/${perfil.slug}`} target="_blank" rel="noreferrer" className="font-medium underline">
            /club/{perfil.slug}
          </a>{t("compartelaConLasEmpresas")}</p>
      )}

      <div className="mb-6 space-y-4">
        <Campo etiqueta={t("logoDelClub")}>
          <div className="flex items-center gap-4">
            {perfil?.logoUrl ? (
              <Image
                src={perfil.logoUrl}
                alt="Logo del club"
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">{t("sinLogo")}</div>
            )}
            <ImageUploader
              userId={userId}
              carpeta="logo"
              label={perfil?.logoUrl ? "Cambiar logo" : "Subir logo"}
              onSubido={async (url) => {
                const resultado = await guardarLogo(url);
                manejarErrorAccion(resultado);
              }}
            />
          </div>
        </Campo>

        <Campo etiqueta={t("fotosDelClub")} ayuda={t("instalacionesAficionEquiposLo")}>
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No subas fotos en las que se identifique con claridad a menores de edad (por
            ejemplo, primeros planos con el rostro visible) sin el consentimiento de sus
            padres o tutores legales, ni incluyas sus nombres completos en descripciones o
            títulos. Los datos de cantera se guardan siempre de forma agregada, nunca con
            fichas de menores concretos.
          </div>

          <label className="mb-3 flex items-start gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={confirmaSinMenores}
              onChange={(evento) => {
                const marcado = evento.target.checked;
                setConfirmaSinMenores(marcado);
                if (marcado) {
                  iniciarTransicion(() => {
                    registrarConfirmacionMenores();
                  });
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />{t("confirmoQueLasFotos")}</label>

          <div className="flex flex-wrap gap-3">
            {fotos.map((foto) => (
              <div key={foto} className="group relative h-20 w-20">
                <Image
                  src={foto}
                  alt="Foto del club"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() =>
                    iniciarTransicion(async () => {
                      const resultado = await eliminarFoto(foto);
                      manejarErrorAccion(resultado);
                    })
                  }
                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white group-hover:flex"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
            {confirmaSinMenores ? (
              <ImageUploader
                userId={userId}
                carpeta="fotos"
                label="Añadir foto"
                onSubido={async (url) => {
                  const resultado = await agregarFoto(url);
                  manejarErrorAccion(resultado);
                }}
              />
            ) : (
              <p className="self-center text-xs text-zinc-400">{t("marcaLaCasillaDe")}</p>
            )}
          </div>
        </Campo>

        <AvisoError mensaje={errorImagen} />
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("nombreDelClub")}>
            <input
              name="name"
              defaultValue={perfil?.name ?? ""}
              required
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("localidad")}>
            <input
              name="city"
              defaultValue={perfil?.city ?? ""}
              required
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta={t("provincia")}>
            <input name="province" defaultValue={perfil?.province ?? ""} className={clasesInput} />
          </Campo>
          <Campo etiqueta={t("codigoPostal")}>
            <input
              name="postalCode"
              defaultValue={perfil?.postalCode ?? ""}
              className={clasesInput}
            />
          </Campo>
        </div>

        <Campo etiqueta={t("instalaciones")}>
          <input
            name="facilities"
            defaultValue={perfil?.facilities ?? ""}
            placeholder={t("campoPabellonCapacidad")}
            className={clasesInput}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta={t("web")}>
            <input
              name="website"
              type="url"
              defaultValue={perfil?.website ?? ""}
              placeholder="https://"
              className={clasesInput}
            />
          </Campo>
          <Campo etiqueta="Vídeo de presentación" ayuda={t("enlaceAYoutubeVimeo")}>
            <input
              name="videoUrl"
              type="url"
              defaultValue={perfil?.videoUrl ?? ""}
              placeholder="https://"
              className={clasesInput}
            />
          </Campo>
        </div>

        <Campo etiqueta="Descripción">
          <textarea
            name="description"
            defaultValue={perfil?.description ?? ""}
            className={clasesTextarea}
          />
        </Campo>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">{t("redesSociales")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="instagram"
              defaultValue={perfil?.socialLinks.instagram ?? ""}
              placeholder="Instagram (URL)"
              className={clasesInput}
            />
            <input
              name="facebook"
              defaultValue={perfil?.socialLinks.facebook ?? ""}
              placeholder="Facebook (URL)"
              className={clasesInput}
            />
            <input
              name="twitter"
              defaultValue={perfil?.socialLinks.twitter ?? ""}
              placeholder="X / Twitter (URL)"
              className={clasesInput}
            />
            <input
              name="tiktok"
              defaultValue={perfil?.socialLinks.tiktok ?? ""}
              placeholder="TikTok (URL)"
              className={clasesInput}
            />
            <input
              name="youtube"
              defaultValue={perfil?.socialLinks.youtube ?? ""}
              placeholder="YouTube (URL)"
              className={clasesInput}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-700">{t("contactoPublico")}</p>
            <p className="text-xs text-zinc-400">{t("elCorreoDeTu")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta={t("nombreDeContacto")}>
              <input
                name="contactName"
                defaultValue={perfil?.contactName ?? ""}
                placeholder={t("personaALaQue")}
                className={clasesInput}
              />
            </Campo>
            <Campo etiqueta={t("telefonoDeContacto")}>
              <input
                name="contactPhone"
                type="tel"
                defaultValue={perfil?.contactPhone ?? ""}
                placeholder={t("ej600000000")}
                className={clasesInput}
              />
            </Campo>
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="contactPublicConsent"
              defaultChecked={perfil?.contactPublicConsent ?? false}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
            />{t("autorizoMostrarElTelefono")}</label>
        </div>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarIdentidad")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
