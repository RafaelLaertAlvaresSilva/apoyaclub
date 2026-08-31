import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
