"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AvisoError } from "@/components/AvisoError";
import { useRouter } from "@/i18n/navigation";
import { guardarLogo } from "../../actions";
import { Campo } from "../../components/SeccionCard";
import { ImageUploader } from "../../components/ImageUploader";
import { PortadaEditor } from "../../components/PortadaEditor";

/**
 * Paso 2 del asistente: el escudo y la foto de portada, con los mismos
 * componentes que "Identidad". Las fotos de la galería se quedan para la
 * ficha completa: aquí solo lo que más cambia cómo se ve la página.
 */
export function PasoImagenes({
  userId,
  logoUrl,
  coverUrl,
  coverPosition,
}: {
  userId: string;
  logoUrl: string | null;
  coverUrl: string | null;
  coverPosition: number;
}) {
  const t = useTranslations("panel.perfil");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <Campo etiqueta={t("logoDelClub")}>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={t("logoDelClub")}
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl border border-placa-borde bg-placa object-contain p-1.5"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
              {t("sinLogo")}
            </div>
          )}
          <ImageUploader
            userId={userId}
            carpeta="logo"
            label={logoUrl ? t("cambiarLogo") : t("subirLogo")}
            onSubido={async (url) => {
              const resultado = await guardarLogo(url);
              if (resultado && "error" in resultado && resultado.error) setError(resultado.error);
              else router.refresh();
            }}
          />
        </div>
      </Campo>

      <PortadaEditor userId={userId} coverUrl={coverUrl} coverPosition={coverPosition} />

      <AvisoError mensaje={error} />
    </div>
  );
}
