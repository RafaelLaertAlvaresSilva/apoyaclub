"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export type EstadoSesion = { cargando: true } | { cargando: false; rol: Role | null };

/**
 * Averigua, desde el navegador, si hay sesión y con qué rol, sin obligar
 * a que la página pública del club (`/club/[slug]`) deje de ser estática
 * y cacheable (Fase 5): esa comprobación en el servidor forzaría a leer
 * las cookies de sesión en cada petición y perder el `revalidate`.
 *
 * Usado por los botones "Solicitar contacto" y "Guardar en favoritos"
 * (Fase 8), que solo tienen sentido para una empresa con sesión iniciada.
 */
export function useSesionActual(): EstadoSesion {
  const [estado, setEstado] = useState<EstadoSesion>({ cargando: true });

  useEffect(() => {
    let activo = true;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      const rol = (data.session?.user.app_metadata?.role as Role | undefined) ?? null;
      setEstado({ cargando: false, rol });
    });

    return () => {
      activo = false;
    };
  }, []);

  return estado;
}
