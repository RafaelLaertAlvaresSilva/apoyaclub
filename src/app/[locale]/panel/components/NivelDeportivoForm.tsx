"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { AvisoDerechosDeImagen } from "./AvisoDerechosDeImagen";
import { ImageUploader } from "./ImageUploader";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import { guardarNivelDeportivo } from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";

export function NivelDeportivoForm({
  perfil,
  userId,
}: {
  perfil: ClubProfile | null;
  userId: string;
}) {
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarNivelDeportivo, null);
  const [fotoMasculino, setFotoMasculino] = useState(perfil?.topCategoryMalePhoto ?? "");
  const [fotoFemenino, setFotoFemenino] = useState(perfil?.topCategoryFemalePhoto ?? "");

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

          <div className="grid gap-5 sm:grid-cols-2">
            <EquipoDeMaximaCategoria
              etiqueta="Equipo masculino"
              nombreCampo="topCategoryMale"
              nombreFoto="topCategoryMalePhoto"
              valor={perfil?.topCategoryMale ?? ""}
              foto={fotoMasculino}
              onFoto={setFotoMasculino}
              userId={userId}
              placeholder={t("ejPrimeraNacional")}
            />
            <EquipoDeMaximaCategoria
              etiqueta="Equipo femenino"
              nombreCampo="topCategoryFemale"
              nombreFoto="topCategoryFemalePhoto"
              valor={perfil?.topCategoryFemale ?? ""}
              foto={fotoFemenino}
              onFoto={setFotoFemenino}
              userId={userId}
              placeholder={t("ejPrimeraNacional")}
            />
          </div>

          <div className="mt-4">
            <AvisoDerechosDeImagen />
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

/**
 * Cada equipo de máxima categoría: en qué juega y su foto.
 *
 * La foto no es un adorno. Una empresa que entra en la ficha del club
 * mira la foto del equipo antes que la categoría, y "Primera Nacional"
 * no le dice nada si no es del mundillo; once personas con la camiseta
 * del club, sí.
 */
function EquipoDeMaximaCategoria({
  etiqueta,
  nombreCampo,
  nombreFoto,
  valor,
  foto,
  onFoto,
  userId,
  placeholder,
}: {
  etiqueta: string;
  nombreCampo: string;
  nombreFoto: string;
  valor: string;
  foto: string;
  onFoto: (url: string) => void;
  userId: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <Campo etiqueta={etiqueta}>
        <input
          name={nombreCampo}
          maxLength={120}
          defaultValue={valor}
          placeholder={placeholder}
          className={clasesInput}
        />
      </Campo>

      <input type="hidden" name={nombreFoto} value={foto} />

      <div className="mt-3">
        {foto ? (
          <div className="mb-2 overflow-hidden rounded-lg border border-zinc-200">
            <Image
              src={foto}
              alt={`Foto del ${etiqueta.toLowerCase()}`}
              width={320}
              height={180}
              className="h-28 w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-2 flex h-28 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
            Sin foto
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <ImageUploader
            userId={userId}
            carpeta="equipos"
            label={foto ? "Cambiar foto" : "Subir foto del equipo"}
            onSubido={async (url) => onFoto(url)}
          />
          {foto && (
            <button
              type="button"
              onClick={() => onFoto("")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
