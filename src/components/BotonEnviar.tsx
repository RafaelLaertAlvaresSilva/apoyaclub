"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

/**
 * El botón de enviar de todos los formularios: panel, acceso, registro
 * y contacto.
 *
 * Se apoya en `Button`, el botón del sistema de diseño, en vez de
 * llevar sus propias clases. Es el primero de una lista larga: los
 * botones de la web están escritos a mano uno por uno y el mismo verde
 * aparece con quince altos distintos. Este es el que más se repite, así
 * que es por donde tiene sentido empezar.
 */
export function BotonEnviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {pending ? "Enviando…" : children}
    </Button>
  );
}
