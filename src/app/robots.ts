import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Reglas para los buscadores (Fase 15). Todo lo público se indexa; las
 * zonas privadas y los enlaces con token no, ni siquiera para que no
 * acaben apareciendo por haberse compartido por WhatsApp:
 *
 * - /panel, /empresa, /admin: zonas con sesión.
 * - /dossier: enlaces de dossier con token y caducidad.
 * - /auth y /api: rutas técnicas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/*/empresa` a secas también tapaba `/es/empresas` y cada ficha
        // de empresa: Google compara por el principio de la ruta, y
        // "/es/empresas" empieza por "/es/empresa". Por eso el panel de
        // empresa se cierra con la barra y con `$` (la ruta exacta), y
        // el directorio público queda abierto.
        disallow: [
          "/api/",
          "/auth/",
          "/*/panel",
          "/*/empresa$",
          "/*/empresa/",
          "/*/admin",
          "/*/dossier/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
