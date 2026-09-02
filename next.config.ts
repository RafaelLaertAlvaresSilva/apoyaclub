import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// El logo, las fotos y los patrocinadores del club viven en Supabase
// Storage (bucket público `club-media`). Registramos ese host para que
// `next/image` pueda optimizarlos de verdad en la página pública del
// club (Fase 5), en vez de servirlos sin comprimir.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

// Fase 14: conecta `src/i18n/request.ts` con Next.js (carga de mensajes
// por petición y el plugin de compilación de next-intl).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Monitorización de errores (Fase 15). El plugin solo sube los mapas de
// código a Sentry cuando existe SENTRY_AUTH_TOKEN (en Vercel); en local
// no hace nada, así que el build sigue funcionando sin cuenta de Sentry.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  disableLogger: true,
});
