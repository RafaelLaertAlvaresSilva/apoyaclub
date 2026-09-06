"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile, CommunityAction } from "@/lib/types";
import { guardarComunidad } from "../actions";
import { AvisoDerechosDeImagen } from "./AvisoDerechosDeImagen";
import { ImageUploader } from "./ImageUploader";
import { SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

export function ComunidadForm({
  perfil,
  userId,
}: {
  perfil: ClubProfile | null;
  userId: string;
}) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(guardarComunidad, null);
  const [acciones, setAcciones] = useState<CommunityAction[]>(perfil?.communityActions ?? []);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [descripcionNueva, setDescripcionNueva] = useState("");
  const [fotoNueva, setFotoNueva] = useState("");

  function anadirAccion() {
    if (!tituloNuevo.trim()) return;
    setAcciones((actuales) => [
      ...actuales,
      {
        title: tituloNuevo.trim(),
        description: descripcionNueva.trim(),
        ...(fotoNueva ? { photo: fotoNueva } : {}),
      },
    ]);
    setTituloNuevo("");
    setDescripcionNueva("");
    setFotoNueva("");
  }

  /** Pone o quita la foto de una acción ya añadida. */
  function cambiarFoto(indice: number, url: string | null) {
    setAcciones((actuales) =>
      actuales.map((accion, i) => {
        if (i !== indice) return accion;
        if (!url) {
          // Se reconstruye sin `photo` en vez de ponerla a null: el
          // tipo la declara opcional, y una clave con null dentro del
          // jsonb no es lo mismo que una clave que no está.
          return { title: accion.title, description: accion.description };
        }
        return { ...accion, photo: url };
      }),
    );
  }

  function quitarAccion(indice: number) {
    setAcciones((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <SeccionCard
      titulo={t("comunidad")}
      descripcion={t("accionesSocialesEducativasO")}
    >
      <form action={formAction} className="space-y-4">
        {acciones.length > 0 && (
          <ul className="space-y-2">
            {acciones.map((accion, indice) => (
              <li
                key={`${accion.title}-${indice}`}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {accion.photo ? (
                  <Image
                    src={accion.photo}
                    alt=""
                    width={96}
                    height={64}
                    className="h-16 w-24 shrink-0 rounded-lg border border-zinc-200 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
                    Sin foto
                  </div>
                )}

                <span className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-900">{accion.title}</span>
                  {accion.description && <span className="text-zinc-600"> — {accion.description}</span>}
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <ImageUploader
                      userId={userId}
                      carpeta="comunidad"
                      label={accion.photo ? "Cambiar foto" : "Subir foto"}
                      onSubido={async (url) => cambiarFoto(indice, url)}
                    />
                    {accion.photo && (
                      <button
                        type="button"
                        onClick={() => cambiarFoto(indice, null)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Quitar foto
                      </button>
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => quitarAccion(indice)}
                  className="shrink-0 text-red-600 hover:underline"
                >{t("quitar")}</button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-3">
          <input
            type="text"
            placeholder={t("tituloDeLaAccion")}
            value={tituloNuevo}
            onChange={(evento) => setTituloNuevo(evento.target.value)}
            className={clasesInput}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcionNueva}
            onChange={(evento) => setDescripcionNueva(evento.target.value)}
            className={clasesTextarea}
          />
          <div className="flex flex-wrap items-center gap-2">
            {fotoNueva && (
              <Image
                src={fotoNueva}
                alt=""
                width={96}
                height={64}
                className="h-16 w-24 rounded-lg border border-zinc-200 object-cover"
                unoptimized
              />
            )}
            <ImageUploader
              userId={userId}
              carpeta="comunidad"
              label={fotoNueva ? "Cambiar foto" : "Subir foto (opcional)"}
              onSubido={async (url) => setFotoNueva(url)}
            />
          </div>

          <button
            type="button"
            onClick={anadirAccion}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >{t("anadirAccion")}</button>
        </div>

        <AvisoDerechosDeImagen />

        <input type="hidden" name="communityActions" value={JSON.stringify(acciones)} />

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>{t("guardarComunidad")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
