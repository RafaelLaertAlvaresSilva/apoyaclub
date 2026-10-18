"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { ImageUploader } from "@/app/[locale]/panel/components/ImageUploader";
import { cabenMas, MAXIMO_FOTOS, sinLaFoto } from "@/lib/fotos-de-oportunidad";

/**
 * Las fotos de una oportunidad, dentro del formulario.
 *
 * POR QUÉ ESTO VENDE. "Lona de 3×1 en el pabellón" obliga a la empresa
 * a imaginarse la pared; la foto de la pared se la enseña. Es lo que
 * más empuja a escribir al club, y hasta ahora el catálogo entero era
 * texto.
 *
 * LAS FOTOS VIAJAN EN CAMPOS OCULTOS. El subidor las manda al almacén
 * en cuanto las eliges y devuelve su dirección; esa dirección se guarda
 * aquí en un `<input type="hidden" name="fotos">` por cada una. Así la
 * acción del servidor las recibe como un campo más del formulario, con
 * `formData.getAll("fotos")`, sin tener que subir nada ella.
 *
 * Y por eso se suben ANTES de guardar: si el club elige tres fotos y
 * luego cierra el formulario sin guardar, esos tres archivos se quedan
 * en el almacén sin que ninguna oportunidad los use. Es el mismo trato
 * que ya tienen el escudo y la portada del club, y la alternativa
 * —guardarlas solo al enviar— obliga a subir las tres de golpe con el
 * botón pulsado, que en un móvil con mala cobertura es peor.
 */
export function FotosDeLaOportunidad({
  userId,
  iniciales,
}: {
  userId: string;
  iniciales: string[];
}) {
  const t = useTranslations("panel.oportunidades.galeria");
  const [fotos, setFotos] = useState<string[]>(iniciales);

  return (
    <div>
      {fotos.map((foto) => (
        <input key={foto} type="hidden" name="fotos" value={foto} />
      ))}

      {fotos.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {fotos.map((foto, posicion) => (
            <li key={foto} className="relative">
              <Image
                src={foto}
                alt={t("fotoN", { n: posicion + 1 })}
                width={160}
                height={120}
                unoptimized
                className="h-24 w-32 rounded-lg border border-zinc-200 bg-placa object-cover"
              />

              {/* La primera es la que sale de miniatura en el buscador,
                  y conviene que el club lo sepa: si no, sube la peor
                  primero y es la que ve media España. */}
              {posicion === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-sobre-color">
                  {t("principal")}
                </span>
              )}

              <button
                type="button"
                onClick={() => setFotos((previas) => sinLaFoto(previas, foto))}
                title={t("quitarEsta")}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm transition-colors hover:border-peligro hover:text-peligro"
              >
                <span className="sr-only">{t("quitarN", { n: posicion + 1 })}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cabenMas(fotos) ? (
        <ImageUploader
          userId={userId}
          carpeta="oportunidades"
          destacado
          label={fotos.length === 0 ? t("anadirUna") : t("anadirOtra")}
          onSubido={(url) =>
            // Con el tope comprobado otra vez aquí: entre que se pulsa
            // el botón y vuelve la subida pasan segundos, y en ese rato
            // caben dos pulsaciones más.
            setFotos((previas) =>
              previas.includes(url) || previas.length >= MAXIMO_FOTOS
                ? previas
                : [...previas, url],
            )
          }
        />
      ) : (
        <p className="text-sm text-zinc-500">
          {t("yaTienesTodas", { n: MAXIMO_FOTOS })}
        </p>
      )}
    </div>
  );
}
