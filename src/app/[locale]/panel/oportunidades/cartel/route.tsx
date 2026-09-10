import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import {
  ETIQUETA_CATEGORIA_NECESIDAD,
  esPorPlazas,
  formatoValorOportunidad,
  porcentajeDePlazas,
} from "@/lib/opportunities";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaNecesidad, Role } from "@/lib/types";

/**
 * El cartel de una oportunidad, en cuadrado y listo para Instagram.
 *
 * El motivo: un club de barrio no consigue patrocinadores porque una
 * empresa entre en su ficha. Los consigue porque el bar de la esquina,
 * la ferretería y la gestoría ya le siguen en Instagram desde hace
 * años. Escribir la oportunidad y esperar a que alguien la encuentre es
 * la mitad del trabajo; esta imagen es la otra mitad, y el club la sube
 * en diez segundos sin abrir ningún programa de diseño.
 *
 * Va en 1080 × 1080 porque es la medida de una publicación de
 * Instagram, y se descarga como archivo (no se abre en una pestaña)
 * para que en el móvil caiga directo en la galería.
 *
 * Necesita Buffer para incrustar el logo, así que runtime de Node.
 */
export const runtime = "nodejs";

const LADO = 1080;

/** El importe como se dice en voz alta: "500 €", no "500,00 €". Los
 * céntimos solo aparecen si de verdad los hay. */
function importeParaCartel(valor: number): string {
  return Number.isInteger(valor)
    ? `${new Intl.NumberFormat("es-ES").format(valor)} €`
    : formatoValorOportunidad.format(valor);
}

/** Una imagen remota metida dentro del PNG. Si falla, se dibuja sin
 * ella: mejor un cartel sin escudo que ningún cartel. */
async function comoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;
    const buffer = await respuesta.arrayBuffer();
    const tipo = respuesta.headers.get("content-type") ?? "image/jpeg";
    return `data:${tipo};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

/** El nombre del archivo, a partir del título de la oportunidad. */
function nombreDeArchivo(titulo: string): string {
  const limpio = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `apoyaclub-${limpio || "oportunidad"}.png`;
}

/** ¿El título ya dice de qué va? Entonces la etiqueta de debajo sobra:
 * "Fisioterapia para la plantilla" seguido de "Fisioterapia" queda a
 * medio hacer. */
function repiteLaCategoria(titulo: string, categoria: CategoriaNecesidad): boolean {
  const sinTildes = (texto: string) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return sinTildes(titulo).includes(sinTildes(ETIQUETA_CATEGORIA_NECESIDAD[categoria]));
}

export async function GET(peticion: Request) {
  const { searchParams } = new URL(peticion.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Falta la oportunidad.", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return new NextResponse("No autorizado.", { status: 401 });
  }

  // El filtro por club_id no sobra aunque RLS ya lo garantice: es la
  // diferencia entre "no se puede" y "no se puede aunque alguien se
  // deje una política mal puesta algún día".
  const [{ data: fila }, { data: club }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .eq("club_id", user.id)
      .maybeSingle<OpportunityRow>(),
    supabase
      .from("clubs")
      .select("name, slug, logo_url, city")
      .eq("id", user.id)
      .maybeSingle<{ name: string; slug: string | null; logo_url: string | null; city: string | null }>(),
  ]);

  if (!fila) return new NextResponse("Esa oportunidad no existe.", { status: 404 });

  const oportunidad = opportunityRowToOpportunity(fila);
  const logo = await comoDataUrl(club?.logo_url ?? null);

  const necesidad = oportunidad.esNecesidad;
  const conPlazas = esPorPlazas(oportunidad);
  const porcentaje = porcentajeDePlazas(oportunidad);

  // Solo los colores del logo, los dos exactos de `globals.css`: azul
  // marino #14304f y verde #14b8a6. Nada más.
  //
  // El primer intento tenía el fondo ámbar para las necesidades y salía
  // un marrón de tierra quemada que no era de ninguna marca. Lo que
  // separa ahora los dos carteles no es un color de fuera, es cuál de
  // los dos manda: el azul de fondo para lo que el club ofrece, el
  // verde de fondo para lo que necesita. Se distinguen a un metro de
  // distancia y los dos siguen siendo ApoyaClub.
  const fondo = necesidad
    ? "linear-gradient(150deg, #0f766e 0%, #14304f 100%)"
    : "linear-gradient(150deg, #14304f 0%, #0b1f38 100%)";
  const acento = necesidad ? "#ccfbf1" : "#14b8a6";
  const suave = "#ccfbf1";

  const antetitulo = necesidad ? "BUSCAMOS COLABORADOR" : "BUSCAMOS PATROCINADOR";

  const direccion = club?.slug ? `${SITE_URL.replace(/^https?:\/\//, "")}/club/${club.slug}` : "apoyaclub.com";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: fondo,
          fontFamily: "sans-serif",
        }}
      >
        {/* Arriba: de quién es el cartel */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {logo && (
            // Aquí no vale `next/image`: esto no lo pinta un navegador,
            // lo pinta Satori para meterlo dentro del PNG, y solo
            // entiende una etiqueta `img` normal.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={110}
              height={110}
              style={{ borderRadius: 24, objectFit: "contain", background: "white" }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "white" }}>
              {club?.name ?? "Tu club"}
            </div>
            {club?.city && (
              <div style={{ display: "flex", fontSize: 28, color: suave, marginTop: 6 }}>
                {club.city}
              </div>
            )}
          </div>
        </div>

        {/* En medio: lo que se ofrece o se necesita */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: acento,
              letterSpacing: 3,
            }}
          >
            {antetitulo}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: oportunidad.title.length > 42 ? 66 : 84,
              fontWeight: 700,
              color: "white",
              marginTop: 20,
              lineHeight: 1.08,
            }}
          >
            {oportunidad.title}
          </div>

          {necesidad ? (
            oportunidad.categoriaNecesidad &&
            !repiteLaCategoria(oportunidad.title, oportunidad.categoriaNecesidad) && (
              <div style={{ display: "flex", fontSize: 40, color: suave, marginTop: 26 }}>
                {ETIQUETA_CATEGORIA_NECESIDAD[oportunidad.categoriaNecesidad]}
              </div>
            )
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 26 }}>
              <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: acento }}>
                {importeParaCartel(oportunidad.value)}
              </div>
              {conPlazas && (
                <div style={{ display: "flex", fontSize: 30, color: suave, marginLeft: 16 }}>
                  por empresa
                </div>
              )}
            </div>
          )}

          {/* La barra: se ve de un vistazo que aún queda sitio */}
          {conPlazas && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
              <div style={{ display: "flex", fontSize: 28, color: suave, marginBottom: 12 }}>
                {oportunidad.slotsTaken} de {oportunidad.slotsTotal}{" "}
                {necesidad ? "colaboradores" : "plazas"}
              </div>
              <div
                style={{
                  display: "flex",
                  width: 920,
                  height: 22,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: (920 * porcentaje) / 100,
                    height: 22,
                    borderRadius: 11,
                    background: acento,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Abajo: dónde verlo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: "2px solid rgba(255,255,255,0.15)",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "white" }}>
            {direccion}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: suave, marginTop: 8 }}>
            Toda la información y contacto en nuestra página
          </div>
        </div>
      </div>
    ),
    {
      width: LADO,
      height: LADO,
      headers: {
        "Content-Disposition": `attachment; filename="${nombreDeArchivo(oportunidad.title)}"`,
        // Es de un club concreto: que no se quede en ninguna caché
        // compartida por el camino.
        "Cache-Control": "private, no-store",
      },
    },
  );
}
