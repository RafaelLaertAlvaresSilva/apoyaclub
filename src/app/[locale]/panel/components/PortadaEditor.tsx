"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import {
  guardarPortada,
  guardarPosicionPortada,
  quitarPortada,
  type EstadoGuardado,
} from "../actions";
import { ImageUploader } from "./ImageUploader";
import { Campo } from "./SeccionCard";

/**
 * Portada de la ficha: subirla y decidir qué franja se ve.
 *
 * La portada es apaisada y muy baja, así que de una foto normal solo cabe
 * una tira. Por defecto se coge la del centro, y eso deja fuera justo lo
 * que importa la mitad de las veces: en una foto de equipo salen los pies
 * y se corta la cara, y en una del pabellón desaparece el marcador.
 *
 * El deslizador enseña el resultado según se mueve, sin recargar ni
 * guardar: al club no le sirve elegir un número a ciegas, le sirve ver
 * dónde queda el corte.
 */
export function PortadaEditor({
  userId,
  coverUrl,
  coverPosition,
}: {
  userId: string;
  coverUrl: string | null;
  coverPosition: number;
}) {
  const [posicion, setPosicion] = useState(coverPosition);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciarTransicion] = useTransition();

  const sinGuardar = posicion !== coverPosition;

  function manejar(resultado: EstadoGuardado) {
    setError(resultado && "error" in resultado ? (resultado.error ?? null) : null);
    setMensaje(resultado && "ok" in resultado && resultado.ok ? "Guardado." : null);
  }

  return (
    <Campo
      etiqueta="Imagen de portada"
      ayuda="La foto ancha de arriba del todo de tu página. Apaisada y de buena calidad: es lo primero que ve una empresa."
      grupo
    >
      <div className="space-y-3">
        {coverUrl ? (
          <>
            {/* Misma proporción que la portada de verdad, para que lo que
                se ve aquí sea lo que va a salir publicado. */}
            <div className="relative h-28 w-full overflow-hidden rounded-lg border border-zinc-200 sm:h-36">
              <Image
                src={coverUrl}
                alt="Portada del club"
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
                style={{ objectPosition: `50% ${posicion}%` }}
                unoptimized
              />
              <button
                type="button"
                onClick={() => iniciarTransicion(async () => manejar(await quitarPortada()))}
                className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow-sm"
              >
                Quitar
              </button>
            </div>

            <div>
              <label
                htmlFor="posicion-portada"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Qué parte de la foto se ve
              </label>
              <input
                id="posicion-portada"
                type="range"
                min={0}
                max={100}
                step={1}
                value={posicion}
                onChange={(evento) => setPosicion(Number(evento.target.value))}
                className="w-full accent-teal-700"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Parte de arriba</span>
                <span>Centro</span>
                <span>Parte de abajo</span>
              </div>

              {sinGuardar && (
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    iniciarTransicion(async () => manejar(await guardarPosicionPortada(posicion)))
                  }
                  className="mt-2 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
                >
                  {guardando ? "Guardando…" : "Guardar encuadre"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 sm:h-36">
            Sin portada
          </div>
        )}

        <ImageUploader
          userId={userId}
          carpeta="fotos"
          label={coverUrl ? "Cambiar portada" : "Subir portada"}
          onSubido={async (url) => manejar(await guardarPortada(url))}
        />

        <AvisoError mensaje={error} />
        <AvisoExito mensaje={mensaje} />
      </div>
    </Campo>
  );
}
