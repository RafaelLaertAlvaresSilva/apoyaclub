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
  /** Botón relleno y con icono, para cuando subir la foto es lo importante del formulario. */
  destacado?: boolean;
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

export function ImageUploader({ userId, carpeta, label, onSubido, destacado = false }: Props) {
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
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border text-sm font-medium transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
          destacado
            ? "border-brand-teal-dark bg-brand-teal-dark px-4 py-2.5 text-sobre-color shadow-sm hover:border-accion-fuerte hover:bg-accion-fuerte"
            : "border-zinc-300 px-3 py-2 text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        {subiendo ? (
          <span
            className={`h-4 w-4 animate-spin rounded-full border-2 ${
              destacado ? "border-white/40 border-t-white" : "border-zinc-300 border-t-zinc-600"
            }`}
            aria-hidden="true"
          />
        ) : (
          destacado && (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
          )
        )}
        {subiendo ? t("subiendo") : label}
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
