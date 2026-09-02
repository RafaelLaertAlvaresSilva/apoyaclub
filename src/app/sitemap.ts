import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Mapa del sitio (Fase 15). Hasta ahora las páginas de club tenían
 * metadatos y Open Graph, pero nada le decía a Google que existieran:
 * el argumento de venta del producto es que la página del club se
 * encuentre, así que el sitemap es parte del producto, no un extra.
 *
 * Se listan solo las rutas públicas. Las zonas privadas (/panel,
 * /empresa, /admin) y los enlaces de dossier quedan fuera aquí y
 * bloqueados en `robots.ts`.
 *
 * Los clubes salen de la vista `club_public_profiles`, que ya filtra
 * por suscripción activa o en prueba y excluye los suspendidos: un club
 * que deja de pagar desaparece del sitemap solo.
 */

export const revalidate = 3600;

const RUTAS_ESTATICAS: { ruta: string; prioridad: number; frecuencia: "daily" | "weekly" | "monthly" }[] = [
  { ruta: "", prioridad: 1, frecuencia: "weekly" },
  { ruta: "/buscar", prioridad: 0.9, frecuencia: "daily" },
  { ruta: "/registro-club", prioridad: 0.8, frecuencia: "monthly" },
  { ruta: "/registro-empresa", prioridad: 0.8, frecuencia: "monthly" },
  { ruta: "/login", prioridad: 0.3, frecuencia: "monthly" },
  { ruta: "/aviso-legal", prioridad: 0.2, frecuencia: "monthly" },
  { ruta: "/privacidad", prioridad: 0.2, frecuencia: "monthly" },
  { ruta: "/cookies", prioridad: 0.2, frecuencia: "monthly" },
  { ruta: "/condiciones-de-uso", prioridad: 0.2, frecuencia: "monthly" },
];

async function clubesPublicos(): Promise<{ slug: string; updatedAt: string | null }[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("club_public_profiles")
      .select("slug, updated_at")
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error || !data) return [];

    return data.map((fila) => ({
      slug: fila.slug as string,
      updatedAt: (fila.updated_at as string | null) ?? null,
    }));
  } catch {
    // Un sitemap incompleto es mejor que un 500: si Supabase no
    // responde, se sirven al menos las rutas estáticas.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clubes = await clubesPublicos();
  const ahora = new Date();

  const estaticas = routing.locales.flatMap((locale) =>
    RUTAS_ESTATICAS.map((entrada) => ({
      url: `${SITE_URL}/${locale}${entrada.ruta}`,
      lastModified: ahora,
      changeFrequency: entrada.frecuencia,
      priority: entrada.prioridad,
    })),
  );

  const fichasDeClub = routing.locales.flatMap((locale) =>
    clubes.map((club) => ({
      url: `${SITE_URL}/${locale}/club/${club.slug}`,
      lastModified: club.updatedAt ? new Date(club.updatedAt) : ahora,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...estaticas, ...fichasDeClub];
}
