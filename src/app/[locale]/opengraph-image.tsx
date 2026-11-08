import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * La imagen que sale al pegar un enlace de ApoyaClub en WhatsApp.
 *
 * Solo la tenían las fichas de club. El enlace a apoyaclub.com —que es
 * justo el que se van a pasar los directivos entre ellos, y el que se
 * manda a una empresa— salía como texto pelado, que en un grupo de
 * WhatsApp parece un enlace dudoso más.
 *
 * Es la de por defecto: cualquier página que no tenga la suya propia
 * usa esta. Las fichas de club sí tienen la suya, con el escudo y el
 * nombre del club.
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ApoyaClub — Conecta tu club deportivo con empresas patrocinadoras";

/**
 * El logo de verdad (pedido por Rafael el 8-11-2026: la imagen con el
 * nombre escrito con letras normales parecía de otra marca). Es la
 * versión para fondo oscuro, con el eslogan en el idioma de la página.
 * En PNG porque el generador de imágenes no lee WebP. Rutas escritas
 * enteras para que Vercel las meta en la función.
 */
const LOGOS: Record<string, () => Promise<Buffer>> = {
  es: () => readFile(join(process.cwd(), "public", "og", "logo-oscuro-es.png")),
  pt: () => readFile(join(process.cwd(), "public", "og", "logo-oscuro-pt.png")),
  br: () => readFile(join(process.cwd(), "public", "og", "logo-oscuro-pt.png")),
  en: () => readFile(join(process.cwd(), "public", "og", "logo-oscuro-en.png")),
};

async function logoEnDatos(locale: string): Promise<string | null> {
  try {
    const bytes = await (LOGOS[locale] ?? LOGOS.es)();
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Public Sans, la letra de la web (en .woff: el generador no lee .woff2). */
async function fuentes() {
  try {
    const [normal, negrita] = await Promise.all([
      readFile(join(process.cwd(), "public", "og", "public-sans-latin-500-normal.woff")),
      readFile(join(process.cwd(), "public", "og", "public-sans-latin-700-normal.woff")),
    ]);
    return [
      { name: "Public Sans", data: normal, weight: 500 as const, style: "normal" as const },
      { name: "Public Sans", data: negrita, weight: 700 as const, style: "normal" as const },
    ];
  } catch {
    return undefined;
  }
}

const NAVY = "#14304f";
const NAVY_OSCURO = "#0b1f38";
const TEAL = "#14b8a6";
const TEAL_CLARO = "#ccfbf1";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: pedido } = await params;
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "common.imagenCompartir" });
  const [logo, letras] = await Promise.all([logoEnDatos(locale), fuentes()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 88px",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_OSCURO} 100%)`,
          fontFamily: letras ? "Public Sans" : "sans-serif",
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo entiende <img>
          <img src={logo} alt="" width={760} height={168} style={{ marginLeft: -14 }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 76, fontWeight: 800, color: "white", letterSpacing: -1 }}>APOYA</span>
              <span style={{ fontSize: 76, fontWeight: 800, color: TEAL, letterSpacing: -1 }}>CLUB</span>
            </div>
            <div style={{ display: "flex", fontSize: 26, color: TEAL_CLARO, letterSpacing: 6, marginTop: 6 }}>
              {t("eslogan")}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            fontSize: 50,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.2,
            marginTop: 40,
            maxWidth: 1000,
          }}
        >
          {t("titular")}
        </div>

        {/* Lo que de verdad decide a quien lo ve: que para la empresa
            esto no cuesta nada. */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            fontSize: 30,
            fontWeight: 600,
            color: NAVY_OSCURO,
            backgroundColor: TEAL,
            borderRadius: 999,
            padding: "12px 28px",
            marginTop: 36,
          }}
        >
          {t("gratis")}
        </div>
      </div>
    ),
    { ...size, fonts: letras },
  );
}
