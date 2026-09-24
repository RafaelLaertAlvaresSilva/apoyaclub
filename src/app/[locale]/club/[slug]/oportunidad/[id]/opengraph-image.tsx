import { ImageResponse } from "next/og";
import {
  ETIQUETA_CATEGORIA_NECESIDAD,
  formatoValorOportunidad,
  plazasLibres,
} from "@/lib/opportunities";
import { obtenerClubPublico } from "../../data";

/**
 * La tarjeta que se ve al compartir UNA oportunidad.
 *
 * La página de la oportunidad existe justo para esto: que el club le
 * mande a la empresa el enlace de lo que le está ofreciendo y no el de
 * su ficha entera. Pero al pegarlo en WhatsApp salía la tarjeta del
 * club —la del segmento de arriba, que Next hereda sola—, así que el
 * enlace decía "Club Deportivo Ejemplo" y no "Tu marca en la camiseta
 * del juvenil, 600 €". Lo importante se perdía justo en el momento en
 * que más se mira.
 *
 * Aquí sale lo que decide: el título, el precio y de qué club es.
 */

// Necesita Buffer (para incrustar el logo como data URL), así que usa
// el runtime de Node en vez del de Edge.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Un título largo no se puede partir en tres líneas sin comerse el
 * precio, y el precio es lo que hace que la empresa abra el enlace. */
function acortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const cortado = texto.slice(0, maximo);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${(ultimoEspacio > maximo * 0.6 ? cortado.slice(0, ultimoEspacio) : cortado).trimEnd()}…`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const datos = await obtenerClubPublico(slug);
  const oportunidad = datos?.oportunidades.find((una) => una.id === id);

  const nombreClub = datos?.perfil.name ?? "ApoyaClub";
  const titulo = oportunidad ? acortar(oportunidad.title, 80) : "Oportunidad de patrocinio";

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

  const esNecesidad = oportunidad?.esNecesidad ?? false;

  // La categoría de una necesidad va arriba, pegada a "LO NECESITAMOS",
  // igual que en la página. Abajo y sola —donde va el precio— se lee
  // como un dato suelto que nadie sabe de qué es.
  const categoria =
    esNecesidad && oportunidad?.categoriaNecesidad
      ? ETIQUETA_CATEGORIA_NECESIDAD[oportunidad.categoriaNecesidad].toUpperCase()
      : null;
  const antetitulo = esNecesidad
    ? ["LO NECESITAMOS", categoria].filter(Boolean).join(" · ")
    : "OPORTUNIDAD DE PATROCINIO";

  // En una necesidad no hay precio: lo que se ofrece ES el servicio, y
  // ponerle una cifra delante confunde a quien la lee.
  const destacado =
    !esNecesidad && oportunidad && oportunidad.value > 0
      ? formatoValorOportunidad.format(oportunidad.value)
      : null;

  // `plazasLibres` ya devuelve 0 cuando la oportunidad no va por
  // plazas, así que no hace falta preguntarlo dos veces.
  const libres = oportunidad && !esNecesidad ? plazasLibres(oportunidad) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #14304f 0%, #0b1f38 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Arriba, de quién es. Quien recibe el enlace por WhatsApp no
            tiene ni idea de qué club le están hablando. */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logoDataUrl && (
            <img
              src={logoDataUrl}
              alt=""
              width={84}
              height={84}
              style={{ borderRadius: 16, objectFit: "contain" }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, color: "#14b8a6", letterSpacing: 2 }}>
              {antetitulo}
            </div>
            <div style={{ display: "flex", fontSize: 34, color: "white", marginTop: 6 }}>
              {nombreClub}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titulo.length > 46 ? 58 : 68,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.12,
          }}
        >
          {titulo}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            {destacado && (
              <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#ccfbf1" }}>
                {destacado}
              </div>
            )}
            {libres > 0 && (
              <div style={{ display: "flex", fontSize: 30, color: "#94a3b8" }}>
                {libres === 1 ? "1 plaza libre" : `${libres} plazas libres`}
              </div>
            )}
          </div>

          <div style={{ display: "flex", fontSize: 26, color: "#94a3b8", letterSpacing: 2 }}>
            APOYACLUB
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
