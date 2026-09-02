/**
 * Bloque gris que ocupa el sitio de un contenido que todavía está
 * cargando (Fase 15). Se usa en los `loading.tsx` de las pantallas
 * lentas: el buscador (que geocodifica antes de responder) y los
 * paneles, que hacen varias consultas a Supabase.
 *
 * `animate-pulse` se desactiva solo si el sistema del usuario pide
 * menos movimiento, por la regla `prefers-reduced-motion` de
 * `globals.css`.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-zinc-200 ${className}`} />;
}

/** Envoltorio accesible: anuncia a un lector de pantalla que se está cargando. */
export function CargandoRegion({ children, etiqueta }: { children: React.ReactNode; etiqueta: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{etiqueta}</span>
      {children}
    </div>
  );
}
