"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubProfile } from "@/lib/types";
import {
  agregarFotoInstalacion,
  eliminarFotoInstalacion,
  guardarInstalaciones,
  type EstadoGuardado,
} from "../actions";
import { Campo, SeccionCard, clasesInput, clasesTextarea } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";

/**
 * Dónde juega el club: dirección, descripción y fotos.
 *
 * Antes esto era un renglón de texto dentro de Identidad. Es de lo
 * primero que mira una empresa que se plantea poner una lona o un vinilo:
 * dónde está, cuánta gente cabe y qué pinta tiene.
 */
export function InstalacionesForm({
  userId,
  perfil,
}: {
  userId: string;
  perfil: ClubProfile | null;
}) {
  const [estado, formAction] = useActionState(guardarInstalaciones, null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [, iniciarTransicion] = useTransition();

  const fotos = perfil?.facilitiesPhotos ?? [];

  function manejarResultado(resultado: EstadoGuardado) {
    setErrorFoto(resultado && "error" in resultado ? (resultado.error ?? null) : null);
  }

  return (
    <SeccionCard
      titulo="Instalaciones"
      descripcion="Dónde juega el club. Es lo primero que mira una empresa que se plantea poner una lona o un vinilo."
    >
      <div className="mb-6">
        <Campo etiqueta="Fotos de las instalaciones" ayuda="El pabellón, el campo, la pista, las gradas.">
          <div className="flex flex-wrap gap-3">
            {fotos.map((foto) => (
              <div key={foto} className="group relative h-20 w-20">
                <Image
                  src={foto}
                  alt="Foto de las instalaciones"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() =>
                    iniciarTransicion(async () => {
                      manejarResultado(await eliminarFotoInstalacion(foto));
                    })
                  }
                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white group-hover:flex"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
            <ImageUploader
              userId={userId}
              carpeta="fotos"
              label="Añadir foto"
              onSubido={async (url) => {
                manejarResultado(await agregarFotoInstalacion(url));
              }}
            />
          </div>
        </Campo>

        <AvisoError mensaje={errorFoto} />
      </div>

      <form action={formAction} className="space-y-4">
        <Campo
          etiqueta="Dirección"
          ayuda="Calle y localidad del pabellón, campo o pista donde jugáis."
        >
          <input
            name="facilitiesAddress"
            defaultValue={perfil?.facilitiesAddress ?? ""}
            placeholder="Pabellón Municipal, C/ del Deporte 4, Vigo"
            maxLength={300}
            className={clasesInput}
          />
        </Campo>

        <Campo
          etiqueta="Descripción"
          ayuda="Aforo, superficie, si hay marcador, cafetería, aparcamiento…"
        >
          <textarea
            name="facilities"
            defaultValue={perfil?.facilities ?? ""}
            placeholder="Pabellón de 800 localidades, parqué, marcador electrónico y cafetería."
            className={clasesTextarea}
          />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Guardado." : null} />

        <BotonEnviar>Guardar instalaciones</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
