"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile, Milestone } from "@/lib/types";
import { guardarHistoria } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";

/**
 * Historia del club: año de fundación e hitos.
 *
 * Cada hito puede llevar además una foto y un enlace a un vídeo. Un
 * ascenso contado con la foto del equipo celebrándolo convence bastante
 * más que la misma frase suelta, y es material que el club ya tiene.
 */
export function HistoriaForm({ userId, perfil }: { userId: string; perfil: ClubProfile | null }) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(guardarHistoria, null);
  const [hitos, setHitos] = useState<Milestone[]>(perfil?.milestones ?? []);
  const [anioNuevo, setAnioNuevo] = useState("");
  const [textoNuevo, setTextoNuevo] = useState("");
  const [fotoNueva, setFotoNueva] = useState("");
  const [videoNuevo, setVideoNuevo] = useState("");

  function anadirHito() {
    const anio = Number.parseInt(anioNuevo, 10);
    if (!Number.isFinite(anio) || !textoNuevo.trim()) return;

    setHitos((actuales) => [
      ...actuales,
      {
        year: anio,
        text: textoNuevo.trim(),
        photoUrl: fotoNueva || null,
        videoUrl: videoNuevo.trim() || null,
      },
    ]);

    setAnioNuevo("");
    setTextoNuevo("");
    setFotoNueva("");
    setVideoNuevo("");
  }

  function quitarHito(indice: number) {
    setHitos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <SeccionCard titulo={t("historia")} descripcion={t("fundacionEHitosDestacados")}>
      <form action={formAction} className="space-y-4">
        <Campo etiqueta={t("anoDeFundacion")}>
          <input
            name="foundingYear"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            defaultValue={perfil?.foundingYear ?? ""}
            className={clasesInput}
          />
        </Campo>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">{t("hitos")}</p>

          {hitos.length > 0 && (
            <ul className="mb-3 space-y-2">
              {hitos
                .map((hito, indice) => ({ hito, indice }))
                .sort((a, b) => a.hito.year - b.hito.year)
                .map(({ hito, indice }) => (
                  <li
                    key={`${hito.year}-${indice}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {hito.photoUrl && (
                        <Image
                          src={hito.photoUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded object-cover"
                          unoptimized
                        />
                      )}
                      <div className="min-w-0">
                        <p>
                          <span className="font-medium text-zinc-900">{hito.year}</span>{" "}
                          <span className="text-zinc-600">{hito.text}</span>
                        </p>
                        {hito.videoUrl && (
                          <p className="truncate text-xs text-teal-700">{hito.videoUrl}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarHito(indice)}
                      className="shrink-0 text-red-600 hover:underline"
                    >
                      {t("quitar")}
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {/* Alta de un hito nuevo. La key se apoya en cuántos hay para
              que el subidor de imagen se reinicie tras añadir uno. */}
          <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-24">
                <input
                  type="number"
                  placeholder={t("ano")}
                  value={anioNuevo}
                  onChange={(evento) => setAnioNuevo(evento.target.value)}
                  className={clasesInput}
                />
              </div>
              <div className="min-w-48 flex-1">
                <input
                  type="text"
                  placeholder={t("descripcionDelHito")}
                  value={textoNuevo}
                  onChange={(evento) => setTextoNuevo(evento.target.value)}
                  className={clasesInput}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Vídeo (opcional)" ayuda="Enlace de YouTube, Vimeo o donde lo tengas.">
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={videoNuevo}
                  onChange={(evento) => setVideoNuevo(evento.target.value)}
                  className={clasesInput}
                />
              </Campo>

              <Campo etiqueta="Foto (opcional)">
                <div className="flex items-center gap-3">
                  {fotoNueva && (
                    <Image
                      src={fotoNueva}
                      alt="Foto del hito"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                      unoptimized
                    />
                  )}
                  <ImageUploader
                    key={hitos.length}
                    userId={userId}
                    carpeta="fotos"
                    label={fotoNueva ? "Cambiar foto" : "Subir foto"}
                    onSubido={(url) => setFotoNueva(url)}
                  />
                </div>
              </Campo>
            </div>

            <button
              type="button"
              onClick={anadirHito}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {t("anadirHito")}
            </button>
          </div>
        </div>

        <input type="hidden" name="milestones" value={JSON.stringify(hitos)} />

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarHistoria")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
