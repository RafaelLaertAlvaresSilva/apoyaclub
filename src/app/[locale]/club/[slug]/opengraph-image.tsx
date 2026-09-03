import { ImageResponse } from "next/og";
import { deportesDelClub, obtenerClubPublico } from "./data";

// Necesita Buffer (para incrustar el logo como data URL), así que usa
// el runtime de Node en vez del de Edge.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = await obtenerClubPublico(slug);

  const nombre = datos?.perfil.name ?? "ApoyaClub";
  const localidad = datos
    ? [datos.perfil.city, datos.perfil.province].filter(Boolean).join(", ")
    : "";
  const deportes = datos ? deportesDelClub(datos.equipos).join(" · ") : "";
  const subtitulo = [deportes, localidad].filter(Boolean).join("   —   ");

  // Mejor esfuerzo: si el logo no se puede descargar, se genera la
  // imagen igualmente sin él.
  let logoDataUrl: string | null = null;
  if (datos?.perfil.logoUrl) {
    try {
      const respuesta = await fetch(datos.perfil.logoUrl);
      if (respuesta.ok) {
        const buffer = await respuesta.arrayBuffer();
        const tipo = respuesta.headers.get("content-type") ?? "image/jpeg";
        logoDataUrl = `data:${tipo};base64,${Buffer.from(buffer).toString("base64")}`;
      }
    } catch {
      logoDataUrl = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {logoDataUrl && (
          <img
            src={logoDataUrl}
            alt=""
            width={104}
            height={104}
            style={{ borderRadius: 20, marginBottom: 32, objectFit: "contain" }}
          />
        )}
        <div style={{ display: "flex", fontSize: 30, color: "#a7f3d0", letterSpacing: 1 }}>
          APOYACLUB
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: "white",
            marginTop: 12,
            lineHeight: 1.1,
          }}
        >
          {nombre}
        </div>
        {subtitulo && (
          <div style={{ display: "flex", fontSize: 32, color: "#d1fae5", marginTop: 20 }}>
            {subtitulo}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
