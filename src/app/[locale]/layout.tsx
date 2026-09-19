import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { CookieBanner } from "@/components/CookieBanner";
import { FavoritosProvider } from "@/components/Favoritos";
import { Footer } from "@/components/Footer";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Necesario para que las URLs de Open Graph (la tarjeta que se ve al
  // compartir la página pública de un club por WhatsApp, Fase 5) se
  // resuelvan como absolutas.
  metadataBase: new URL(SITE_URL),
  // Con plantilla, para que cada página solo tenga que poner su nombre
  // y no repetir "| ApoyaClub" a mano en cada archivo. Las pantallas de
  // acceso y registro no ponían ninguno: la pestaña decía "ApoyaClub" a
  // secas, y /registro-club está en el mapa del sitio que lee Google.
  title: {
    default: "ApoyaClub — Conecta tu club deportivo con empresas patrocinadoras",
    template: "%s | ApoyaClub",
  },
  description: "Conecta tu club deportivo con empresas patrocinadoras.",
  // Lo que lee WhatsApp, Telegram o LinkedIn al pegar un enlace. La
  // imagen la pone `opengraph-image.tsx` de esta misma carpeta; las
  // fichas de club tienen la suya y esta les deja el resto puesto.
  openGraph: {
    type: "website",
    siteName: "ApoyaClub",
    locale: "es_ES",
    url: SITE_URL,
    title: "ApoyaClub — Conecta tu club deportivo con empresas patrocinadoras",
    description:
      "Tu club publica lo que puede ofrecer y las empresas de tu zona lo encuentran. Para las empresas es gratis y sin cuenta.",
  },
  appleWebApp: {
    // Fase 15: para que "Añadir a pantalla de inicio" en iOS use el
    // nombre de la marca en vez de la URL, con el icono de
    // `apple-icon.png` (convención de archivo, se detecta solo).
    title: "ApoyaClub",
    statusBarStyle: "default",
  },
};

// Color de la barra de direcciones en Android y de la barra de estado en
// iOS cuando la web está en pantalla completa (Fase 15, mejoras para
// móvil): el azul marino de marca en vez del blanco/gris por defecto.
export const viewport: Viewport = {
  themeColor: "#14304f",
};

// Fase 14: una versión estática por idioma soportado (solo "es" por ahora).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // Cualquier segmento que no sea un idioma soportado (o que el propio
  // enrutado de next-intl no haya podido resolver) es un 404, no un
  // idioma por defecto silencioso.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Lo primero que encuentra quien navega con el teclado o con un
            lector de pantalla. Está escondido hasta que se le da el
            foco, y entonces salta a la vista arriba a la izquierda: sin
            él hay que pasar por la cabecera entera en cada página. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-navy focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido
        </a>

        <NextIntlClientProvider>
          {/* Los favoritos hacen falta en el buscador, en la ficha del
              club y en la página de guardados, así que el estado vive
              aquí arriba y no en cada una. Pregunta una sola vez por
              carga quién está mirando. */}
          <FavoritosProvider>{children}</FavoritosProvider>
          <Footer />
          <CookieBanner />
          {/*
            Analítica de producto: sin ella se sabe cuántos clubes se
            registran, pero no cuántos llegan a la landing y se van.
            Vercel Analytics no usa cookies ni identifica a nadie, así
            que no depende del banner de consentimiento; solo funciona en
            los despliegues de Vercel con la analítica activada, en local
            no envía nada.
          */}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
