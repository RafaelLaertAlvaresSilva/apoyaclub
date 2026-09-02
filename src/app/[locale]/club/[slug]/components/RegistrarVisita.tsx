"use client";

import { useEffect } from "react";

/**
 * Avisa al servidor de que alguien ha abierto la página del club, para
 * la métrica "visitas" del panel (migración 0014). No pinta nada.
 *
 * Se hace en el cliente porque la página se sirve cacheada, así que
 * contar en el render daría cifras a ojo. `sessionStorage` evita contar
 * varias veces si la persona navega adelante y atrás dentro de la misma
 * pestaña; el servidor vuelve a deduplicar por IP y hora.
 */
export function RegistrarVisita({ slug }: { slug: string }) {
  useEffect(() => {
    const clave = `apoyaclub_visita_${slug}`;

    try {
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch {
      // Navegador sin almacenamiento (o en privado): se sigue igual, la
      // deduplicación del servidor se encarga.
    }

    void fetch("/api/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // Una métrica que falla no se le cuenta a nadie: no hay nada que hacer.
    });
  }, [slug]);

  return null;
}
