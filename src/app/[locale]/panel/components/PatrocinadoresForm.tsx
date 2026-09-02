"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useState } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { BotonEnviar } from "@/components/BotonEnviar";
import type { ClubSponsor } from "@/lib/types";
import { agregarPatrocinador, eliminarPatrocinador, type EstadoGuardado } from "../actions";
import { Campo, SeccionCard, clasesInput } from "./SeccionCard";
import { ImageUploader } from "./ImageUploader";

export function PatrocinadoresForm({
  userId,
  patrocinadores,
}: {
  userId: string;
  patrocinadores: ClubSponsor[];
}) {
  const t = useTranslations("panel.perfil2");
  const [estado, formAction] = useActionState(agregarPatrocinador, null);

  return (
    <SeccionCard
      titulo={t("patrocinadoresActuales")}
      descripcion={t("lasEmpresasQueYa")}
    >
      {patrocinadores.length > 0 && (
        <ul className="mb-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {patrocinadores.map((patrocinador) => (
            <li
              key={patrocinador.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                {patrocinador.logoUrl ? (
                  <Image
                    src={patrocinador.logoUrl}
                    alt={patrocinador.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-cover"
                    unoptimized
                  />
                ) : null}
                <div>
                  <p className="font-medium text-zinc-900">{patrocinador.name}</p>
                  {patrocinador.website && (
                    <p className="text-zinc-500">{patrocinador.website}</p>
                  )}
                </div>
              </div>
              <form action={eliminarPatrocinador}>
                <input type="hidden" name="id" value={patrocinador.id} />
                <button type="submit" className="text-sm font-medium text-red-600 hover:underline">{t("eliminar")}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* La key cambia cuando se añade un patrocinador (revalidatePath
          refresca `patrocinadores`), lo que remonta el formulario y limpia
          tanto sus campos como el logo ya subido. */}
      <FormularioNuevoPatrocinador
        key={patrocinadores.length}
        userId={userId}
        formAction={formAction}
        estado={estado}
      />
    </SeccionCard>
  );
}

function FormularioNuevoPatrocinador({
  userId,
  formAction,
  estado,
}: {
  userId: string;
  formAction: (formData: FormData) => void;
  estado: EstadoGuardado;
}) {
  const t = useTranslations("panel.perfil2");
  const [logoUrl, setLogoUrl] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta={t("nombre")}>
          <input name="name" required className={clasesInput} />
        </Campo>
        <Campo etiqueta={t("web")}>
          <input name="website" type="url" placeholder="https://" className={clasesInput} />
        </Campo>
      </div>

      <Campo etiqueta="Logo">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt="Logo del patrocinador"
              width={40}
              height={40}
              className="h-10 w-10 rounded object-cover"
              unoptimized
            />
          )}
          <ImageUploader
            userId={userId}
            carpeta="patrocinadores"
            label={logoUrl ? "Cambiar logo" : "Subir logo"}
            onSubido={(url) => setLogoUrl(url)}
          />
        </div>
      </Campo>
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <AvisoError mensaje={estado && "error" in estado ? estado.error : null} />
      <AvisoExito mensaje={estado && "ok" in estado && estado.ok ? "Patrocinador añadido." : null} />

      <BotonEnviar>{t("anadirPatrocinador")}</BotonEnviar>
    </form>
  );
}
