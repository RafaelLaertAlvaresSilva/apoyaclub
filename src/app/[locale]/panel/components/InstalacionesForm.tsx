"use client";

import { useTranslations } from "next-intl";
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
import { AvisoDerechosDeImagen } from "./AvisoDerechosDeImagen";
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
  const t = useTranslations("panel.perfil");
  const [estado, formAction] = useActionState(guardarInstalaciones, null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [, iniciarTransicion] = useTransition();

  const fotos = perfil?.facilitiesPhotos ?? [];

  function manejarResultado(resultado: EstadoGuardado) {
    setErrorFoto(resultado && "error" in resultado ? (resultado.error ?? null) : null);
  }

  return (
    <SeccionCard
      titulo={t("instalaciones")}
      descripcion={t("dondeJuegaClubPrimero")}
    >
      <div className="mb-6">
        <Campo
          etiqueta={t("fotosInstalaciones")}
          ayuda={t("pabellonCampoPistaGradas")}
        >
          <div className="flex flex-wrap gap-3">
            {fotos.map((foto) => (
              <div key={foto} className="group relative h-20 w-20">
                <Image
                  src={foto}
                  alt={t("fotoInstalaciones")}
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
                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-peligro text-xs text-sobre-color group-hover:flex"
                  aria-label={t("quitarFoto")}
                >
                  ×
                </button>
              </div>
            ))}
            <ImageUploader
              userId={userId}
              carpeta="fotos"
              label={t("anadirFoto")}
              onSubido={async (url) => {
                manejarResultado(await agregarFotoInstalacion(url));
              }}
            />
          </div>
        </Campo>

        <div className="mt-3">
          <AvisoDerechosDeImagen />
        </div>

        <AvisoError mensaje={errorFoto} />
      </div>

      <form action={formAction} className="space-y-4">
        <Campo
          etiqueta={t("direccion")}
          ayuda={t("calleLocalidadPabellonCampo")}
        >
          <input
            name="facilitiesAddress"
            defaultValue={perfil?.facilitiesAddress ?? ""}
            placeholder={t("pabellonMunicipalCDeporte")}
            maxLength={300}
            className={clasesInput}
          />
        </Campo>

        <Campo
          etiqueta={t("descripcion")}
          ayuda={t("aforoSuperficieSiHay")}
        >
          <textarea
            name="facilities"
            defaultValue={perfil?.facilities ?? ""}
            placeholder={t("pabellon800LocalidadesParque")}
            className={clasesTextarea}
          />
        </Campo>

        <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
        <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? t("guardado") : null} />

        <BotonEnviar>{t("guardarInstalaciones")}</BotonEnviar>
      </form>
    </SeccionCard>
  );
}
