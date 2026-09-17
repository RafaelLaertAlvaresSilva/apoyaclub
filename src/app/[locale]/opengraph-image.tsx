import { ImageResponse } from "next/og";

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

const NAVY = "#14304f";
const NAVY_OSCURO = "#0b1f38";
const TEAL = "#14b8a6";
const TEAL_CLARO = "#ccfbf1";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 88,
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_OSCURO} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 76, fontWeight: 800, color: "white", letterSpacing: -1 }}>
            APOYA
          </span>
          <span style={{ fontSize: 76, fontWeight: 800, color: TEAL, letterSpacing: -1 }}>
            CLUB
          </span>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: TEAL_CLARO, letterSpacing: 6, marginTop: 6 }}>
          CONECTA · IMPULSA · CRECE
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 44,
            color: "white",
            lineHeight: 1.25,
            marginTop: 48,
            maxWidth: 900,
          }}
        >
          Conecta tu club deportivo con empresas que quieren patrocinarlo.
        </div>

        {/* Lo que de verdad decide a quien lo ve: que para la empresa
            esto no cuesta nada. */}
        <div style={{ display: "flex", fontSize: 30, color: TEAL_CLARO, marginTop: 28 }}>
          Para las empresas es gratis y sin cuenta.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 52,
            height: 6,
            width: 180,
            backgroundColor: TEAL,
            borderRadius: 999,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
