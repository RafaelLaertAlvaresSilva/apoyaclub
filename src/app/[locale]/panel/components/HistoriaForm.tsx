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

  /**
   * Cuál de los hitos ya añadidos se está editando, si alguno.
   *
   * Antes solo se podía quitar y volver a escribirlo entero: cambiar
   * un año mal puesto costaba teclear otra vez la descripción y volver
   * a subir la foto.
   */
  const [editando, setEditando] = useState<number | null>(null);

  /** Cambia algo de un hito ya añadido. */
  function cambiarHito(indice: number, cambios: Partial<Milestone>) {
    setHitos((actuales) =>
      actuales.map((hito, i) => (i === indice ? { ...hito, ...cambios } : hito)),
    );
  }

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
    setEditando(null);
  }

  /**
   * Lo que se guarda: los hitos de la lista más el que esté a medio
   * escribir. Mismo motivo que en Acción social: quien rellena el año y
   * el texto y le da a "Guardar" sin pasar por "Añadir hito" perdía lo
   * escrito sin ningún aviso.
   */
  const anioPendiente = Number.parseInt(anioNuevo, 10);
  const hitoPendiente: Milestone | null =
    Number.isFinite(anioPendiente) && textoNuevo.trim()
      ? {
          year: anioPendiente,
          text: textoNuevo.trim(),
          photoUrl: fotoNueva || null,
          videoUrl: videoNuevo.trim() || null,
        }
      : null;

  const hitosAGuardar = hitoPendiente ? [...hitos, hitoPendiente] : hitos;

  // Al guardar bien, lo pendiente pasa a la lista y se vacían las
  // casillas: si no, el siguiente guardado lo mandaría otra vez.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado && "ok" in estado && estado.ok && hitoPendiente) {
      setHitos(hitosAGuardar);
      setAnioNuevo("");
      setTextoNuevo("");
      setFotoNueva("");
      setVideoNuevo("");
    }
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
                // Mientras se edita un año no se reordena: la lista
                // saltaría bajo el dedo a media cifra escrita.
                .sort((a, b) => (editando === null ? a.hito.year - b.hito.year : a.indice - b.indice))
                .map(({ hito, indice }) => (
                  // La clave es la posición y no el año: al editar, el
                  // año cambia con cada tecla y React tiraba la casilla
                  // para montar otra, o sea que el cursor se salía.
                  <li
                    key={indice}
                    className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
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
                      {editando === indice ? (
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex flex-wrap items-start gap-2">
                            <div className="w-24">
                              <input
                                type="number"
                                value={hito.year}
                                onChange={(evento) =>
                                  cambiarHito(indice, {
                                    year: Number.parseInt(evento.target.value, 10) || 0,
                                  })
                                }
                                aria-label={t("ano")}
                                className={clasesInput}
                              />
                            </div>
                            <div className="min-w-48 flex-1">
                              <input
                                type="text"
                                value={hito.text}
                                onChange={(evento) => cambiarHito(indice, { text: evento.target.value })}
                                aria-label={t("descripcionDelHito")}
                                className={clasesInput}
                              />
                            </div>
                          </div>
                          <input
                            type="url"
                            value={hito.videoUrl ?? ""}
                            onChange={(evento) =>
                              cambiarHito(indice, { videoUrl: evento.target.value || null })
                            }
                            placeholder="https://youtube.com/..."
                            aria-label="Vídeo del hito"
                            className={clasesInput}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <ImageUploader
                              userId={userId}
                              carpeta="fotos"
                              label={hito.photoUrl ? "Cambiar foto" : "Subir foto"}
                              onSubido={async (url) => cambiarHito(indice, { photoUrl: url })}
                            />
                            {hito.photoUrl && (
                              <button
                                type="button"
                                onClick={() => cambiarHito(indice, { photoUrl: null })}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                              >
                                Quitar foto
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <p>
                            <span className="font-medium text-zinc-900">{hito.year}</span>{" "}
                            <span className="text-zinc-600">{hito.text}</span>
                          </p>
                          {hito.videoUrl && (
                            <p className="truncate text-xs text-teal-700">{hito.videoUrl}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditando(editando === indice ? null : indice)}
                        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        {editando === indice ? "Hecho" : "Editar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarHito(indice)}
                        className="text-red-600 hover:underline"
                      >
                        {t("quitar")}
                      </button>
                    </div>
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

        <input type="hidden" name="milestones" value={JSON.stringify(hitosAGuardar)} />

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarHistoria")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
