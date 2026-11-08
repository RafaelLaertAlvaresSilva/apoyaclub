import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * La imagen de marca que sale al pegar un enlace de ApoyaClub en
 * WhatsApp: el logo, un titular y una etiqueta verde. La usan la de
 * por defecto (`[locale]/opengraph-image.tsx`, pensada para empresas) y
 * la de /para-clubes (pedida por Rafael el 8-11-2026: el enlace que se
 * manda a un club no puede decir "para las empresas es gratis").
 */
export const TAMANO_IMAGEN = { width: 1200, height: 630 };

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

export async function imagenDeMarca({
  locale,
  titular,
  etiqueta,
  eslogan,
}: {
  locale: string;
  titular: string;
  /** La frase de la etiqueta verde. */
  etiqueta: string;
  /** Por si no se puede leer el logo: se escribe el nombre a mano. */
  eslogan: string;
}): Promise<ImageResponse> {
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
              {eslogan}
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
          {titular}
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
          {etiqueta}
        </div>
      </div>
    ),
    { ...TAMANO_IMAGEN, fonts: letras },
  );
}
