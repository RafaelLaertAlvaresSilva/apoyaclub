import type { MetadataRoute } from "next";

/**
 * Manifest de aplicación web (Fase 1 / Fase 15: mejoras para móvil). Es lo
 * que usa Android para el icono y el nombre al "Añadir a pantalla de
 * inicio"; en iOS ese papel lo hace `apple-icon.png` (convención de
 * archivo de Next.js, no hace falta declararlo aquí).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ApoyaClub",
    short_name: "ApoyaClub",
    description: "Conecta tu club deportivo con empresas patrocinadoras.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14304f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
