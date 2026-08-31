import type { NextConfig } from "next";

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

export default nextConfig;
