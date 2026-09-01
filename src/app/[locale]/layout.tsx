import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { CookieBanner } from "@/components/CookieBanner";
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
  title: "ApoyaClub",
  description: "Conecta tu club deportivo con empresas patrocinadoras.",
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
        <NextIntlClientProvider>
          {children}
          <Footer />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
