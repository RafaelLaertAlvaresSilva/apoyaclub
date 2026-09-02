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
        disallow: ["/api/", "/auth/", "/*/panel", "/*/empresa", "/*/admin", "/*/dossier/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
