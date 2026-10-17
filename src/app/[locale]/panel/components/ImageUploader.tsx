"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorImagenInvalida } from "@/lib/image-compression";
import { subirImagenClub } from "@/lib/club-storage";

type Props = {
  userId: string;
  carpeta:
    | "logo"
    | "fotos"
    | "patrocinadores"
    | "equipos"
    | "comunidad"
    | "logo-empresa"
    | "oportunidades";
  label: string;
  onSubido: (url: string) => Promise<void> | void;
};

/**
 * Botón para subir una imagen: la comprime en el navegador, la sube a
 * Supabase Storage (carpeta de quien sube) y avisa al padre con la URL
 * pública resultante para que la guarde donde corresponda.
 *
 * Vale igual para un club y para una empresa: la regla del bucket solo
 * comprueba que la carpeta raíz sea el identificador de quien sube, sin
 * mirar de qué tipo de cuenta se trata.
 */
const MOTIVOS_CONOCIDOS: Record<string, string> = {
  "El archivo no es una imagen.": "noEsImagen",
  "La imagen pesa demasiado (máximo 15 MB).": "pesaDemasiado",
  "Tu navegador no permite procesar imágenes.": "navegador",
  "No se ha podido procesar la imagen.": "noProcesada",
  "No se ha podido leer la imagen.": "noLeida",
};

export function ImageUploader({ userId, carpeta, label, onSubido }: Props) {
  const t = useTranslations("panel.imagenes");
  const [supabase] = useState(() => createClient());
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarCambio(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setSubiendo(true);
    setError(null);

    try {
      const url = await subirImagenClub(supabase, userId, carpeta, archivo);
      await onSubido(url);
    } catch (excepcion) {
      // Los motivos llegan escritos en español desde las librerías;
      // los conocidos se enseñan en el idioma del panel.
      const motivo = excepcion instanceof Error ? excepcion.message : "";
      const conocido = MOTIVOS_CONOCIDOS[motivo];
      if (conocido) {
        setError(t(conocido));
      } else if (motivo.startsWith("Tu sesión no tiene permiso")) {
        setError(t("sinPermiso"));
      } else if (excepcion instanceof ErrorImagenInvalida) {
        setError(motivo);
      } else if (motivo.startsWith("No se ha podido subir la imagen:")) {
        setError(`${t("noSubida")} (${motivo.slice("No se ha podido subir la imagen:".length).trim()})`);
      } else {
        setError(t("noSubida"));
      }
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        {subiendo && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
            aria-hidden="true"
          />
        )}
        {subiendo ? "Subiendo…" : label}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={subiendo}
          onChange={manejarCambio}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
