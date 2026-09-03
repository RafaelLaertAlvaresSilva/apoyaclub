"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorImagenInvalida } from "@/lib/image-compression";
import { subirImagenClub } from "@/lib/club-storage";

type Props = {
  userId: string;
  carpeta: "logo" | "fotos" | "patrocinadores";
  label: string;
  onSubido: (url: string) => Promise<void> | void;
};

/**
 * Botón para subir una imagen: la comprime en el navegador, la sube a
 * Supabase Storage (carpeta del propio club) y avisa al padre con la URL
 * pública resultante para que la guarde donde corresponda.
 */
export function ImageUploader({ userId, carpeta, label, onSubido }: Props) {
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
      if (excepcion instanceof ErrorImagenInvalida) {
        setError(excepcion.message);
      } else if (excepcion instanceof Error) {
        // `subirImagenClub` ya trae el motivo dentro del mensaje.
        setError(excepcion.message);
      } else {
        setError("No se ha podido subir la imagen. Inténtalo de nuevo.");
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
