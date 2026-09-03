import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { agruparPatrocinadoresPorNivel } from "@/lib/club-mappers";
import { deportesDelClub, seccionesConContenido } from "@/lib/dossier";
import { formatoValorOportunidad } from "@/lib/opportunities";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import type {
  ClubProfile,
  ClubSponsor,
  ClubTeam,
  DossierSectionKey,
  Opportunity,
  SocialLinks,
} from "@/lib/types";

/**
 * Generador del dossier comercial en PDF (Fase 9). Se genera siempre en
 * el servidor (Node, con `renderToBuffer`), nunca en el navegador: los
 * Route Handlers de descarga (`/panel/dossier/pdf`) y de enlace público
 * (`/dossier/[token]`) son los únicos que lo invocan.
 *
 * No hay ningún archivo guardado en ningún sitio: el PDF se reconstruye
 * al vuelo cada vez a partir de los datos actuales del club, así que el
 * dossier descargado o compartido siempre refleja la última versión del
 * perfil, sin necesidad de regenerarlo manualmente ni de limpiar nada.
 *
 * Sobre la forma del documento: esto no es un informe, es material de
 * venta. Quien lo abre es alguien de una empresa que le va a dedicar
 * medio minuto antes de decidir si sigue leyendo, así que:
 *
 *   - La portada responde "¿por qué me interesa?" sin pasar de página:
 *     cuatro cifras grandes y desde cuánto se puede colaborar.
 *   - Las oportunidades van al principio, no al final. Son lo que se
 *     vende; ponerlas detrás de la historia del club es enseñar el
 *     catálogo después de la despedida.
 *   - El contacto va destacado y una sola vez. Es la llamada a la
 *     acción de todo el documento.
 */

const COLOR_MARCA = "#14304f"; // brand-navy (azul marino de marca)
const COLOR_ACENTO = "#0f766e"; // brand-teal-dark
const COLOR_ACENTO_SUAVE = "#e6f0ee";
const COLOR_TEXTO = "#18181b"; // zinc-900
const COLOR_TEXTO_SUAVE = "#52525b"; // zinc-600
const COLOR_TEXTO_TENUE = "#a1a1aa"; // zinc-400
const COLOR_BORDE = "#e4e4e7"; // zinc-200

const ETIQUETA_NIVEL_EQUIPO: Record<ClubTeam["teamLevel"], string> = {
  primer_equipo: "Primer equipo",
  cantera: "Cantera",
};

const ETIQUETA_RED: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const formatoNumero = new Intl.NumberFormat("es-ES");
const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });

const estilos = StyleSheet.create({
  // -----------------------------------------------------------------
  // Portada
  // -----------------------------------------------------------------
  paginaPortada: {
    fontFamily: "Helvetica",
    color: COLOR_TEXTO,
    display: "flex",
    flexDirection: "column",
  },
  bandaPortada: { height: 190, backgroundColor: COLOR_MARCA },
  bandaImagen: { width: "100%", height: 190, objectFit: "cover" },
  cuerpoPortada: {
    paddingHorizontal: 48,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  tarjetaLogo: {
    width: 96,
    height: 96,
    marginTop: -48,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#ffffff",
    padding: 6,
  },
  logo: {
    width: "100%",
    height: "100%",
    // Entero, sin recortar: un escudo alto o una marca apaisada perdían
    // el nombre al ajustarlos a un cuadrado.
    objectFit: "contain",
  },
  logoVacio: {
    width: 96,
    height: 96,
    marginTop: -48,
    backgroundColor: COLOR_ACENTO_SUAVE,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoVacioLetra: { fontSize: 36, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },
  portadaEtiqueta: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: COLOR_ACENTO,
    marginTop: 20,
  },
  portadaNombre: { fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 6, color: COLOR_MARCA },
  portadaDetalle: { fontSize: 11, color: COLOR_TEXTO_SUAVE, marginTop: 6 },
  portadaResumen: { fontSize: 11, color: COLOR_TEXTO, marginTop: 16, lineHeight: 1.5 },

  filaCifras: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  cifra: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 108,
  },
  cifraValor: { fontSize: 22, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  cifraEtiqueta: { fontSize: 8, color: COLOR_TEXTO_SUAVE, marginTop: 3 },

  reclamo: { marginTop: 22, backgroundColor: COLOR_ACENTO_SUAVE, borderRadius: 8, padding: 16 },
  reclamoTexto: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },
  reclamoDetalle: { fontSize: 9, color: COLOR_TEXTO_SUAVE, marginTop: 4 },

  confianza: { marginTop: 28 },
  confianzaEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: COLOR_TEXTO_TENUE,
    marginBottom: 5,
  },
  confianzaNombres: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO_SUAVE, lineHeight: 1.5 },
  portadaPie: {
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDE,
    paddingTop: 10,
    paddingBottom: 40,
    marginTop: 24,
  },
  marcaApoyaClub: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  marcaApoyaClubSub: { fontSize: 8, color: COLOR_TEXTO_TENUE, marginTop: 2 },

  // -----------------------------------------------------------------
  // Contenido
  // -----------------------------------------------------------------
  paginaContenido: {
    padding: 40,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    color: COLOR_TEXTO,
    fontSize: 10,
  },
  seccion: { marginBottom: 22 },
  seccionEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: COLOR_ACENTO,
    marginBottom: 3,
  },
  seccionTitulo: { fontSize: 15, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  seccionDescripcion: { fontSize: 9, color: COLOR_TEXTO_SUAVE, marginTop: 2 },
  seccionRegla: { borderBottomWidth: 2, borderBottomColor: COLOR_ACENTO, width: 32, marginTop: 6, marginBottom: 10 },
  parrafo: { fontSize: 10, lineHeight: 1.5, color: COLOR_TEXTO_SUAVE, marginBottom: 6 },

  filaTarjetas: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tarjeta: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 104,
  },
  tarjetaValor: { fontSize: 17, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  tarjetaEtiqueta: { fontSize: 8, color: COLOR_TEXTO_SUAVE, marginTop: 2 },

  hito: { display: "flex", flexDirection: "row", gap: 10, marginBottom: 5 },
  hitoAno: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO, width: 34 },

  filaSponsors: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filaSponsor: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  logoPequeno: {
    width: 28,
    height: 28,
    borderRadius: 4,
    // Mismo motivo que el logo del club: el de un patrocinador suele ser
    // una marca apaisada y recortarla a un cuadrado se come el nombre.
    objectFit: "contain",
    marginRight: 8,
  },
  grupoSponsorEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR_TEXTO_TENUE,
    marginBottom: 4,
  },

  oportunidad: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderLeftWidth: 3,
    borderLeftColor: COLOR_ACENTO,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  oportunidadCabecera: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  oportunidadTitulo: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO, flexGrow: 1 },
  oportunidadValor: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },
  oportunidadDuracion: { fontSize: 8, color: COLOR_TEXTO_TENUE, marginTop: 4 },
  oportunidadExclusiva: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO, marginTop: 4 },

  // -----------------------------------------------------------------
  // Contacto: la llamada a la acción del documento
  // -----------------------------------------------------------------
  contacto: { backgroundColor: COLOR_MARCA, borderRadius: 8, padding: 20, marginTop: 8 },
  contactoEtiqueta: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, color: "#7fcfc3" },
  contactoTitulo: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 4 },
  contactoLinea: { fontSize: 11, color: "#ffffff", marginTop: 8 },
  contactoTenue: { fontSize: 9, color: "#c7d3e0", marginTop: 8 },

  pie: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDE,
    paddingTop: 8,
    fontSize: 8,
    color: COLOR_TEXTO_TENUE,
  },
});

export type DatosDossierPdf = {
  perfil: ClubProfile;
  equipos: ClubTeam[];
  patrocinadores: ClubSponsor[];
  oportunidades: Opportunity[];
  secciones: DossierSectionKey[];
  emailContacto: string | null;
};

function Pie({ url }: { url: string }) {
  return (
    <View style={estilos.pie} fixed>
      <Text>{url.replace(/^https?:\/\//, "")}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `ApoyaClub · página ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}

function Tarjeta({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.tarjetaValor}>{valor}</Text>
      <Text style={estilos.tarjetaEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.cifra}>
      <Text style={estilos.cifraValor}>{valor}</Text>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function Seccion({
  etiqueta,
  titulo,
  descripcion,
  children,
}: {
  etiqueta?: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={estilos.seccion} wrap={false}>
      {etiqueta && <Text style={estilos.seccionEtiqueta}>{etiqueta.toUpperCase()}</Text>}
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
      {descripcion && <Text style={estilos.seccionDescripcion}>{descripcion}</Text>}
      <View style={estilos.seccionRegla} />
      {children}
    </View>
  );
}

/** Construye el documento y lo renderiza a un Buffer con el PDF final. */
export async function generarDossierPdf(datos: DatosDossierPdf): Promise<Buffer> {
  return renderToBuffer(<DossierDocumento {...datos} />);
}

function DossierDocumento({
  perfil,
  equipos,
  patrocinadores,
  oportunidades,
  secciones,
  emailContacto,
}: DatosDossierPdf) {
  const disponibles = seccionesConContenido(perfil, equipos, patrocinadores);
  const incluir = (clave: DossierSectionKey) => secciones.includes(clave) && disponibles.has(clave);

  const deportes = deportesDelClub(equipos);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const urlPublica = `${SITE_URL}/${routing.defaultLocale}/club/${perfil.slug}`;

  const redesSociales = (Object.entries(perfil.socialLinks) as [keyof SocialLinks, string | undefined][])
    .filter((entrada): entrada is [keyof SocialLinks, string] => !!entrada[1]);

  const seguidoresTotales = Object.values(perfil.followersByNetwork).reduce<number>(
    (suma, valor) => suma + (valor ?? 0),
    0,
  );

  const jugadoresEnEquipos = equipos.reduce<number>(
    (suma, equipo) => suma + (equipo.playerCount ?? 0),
    0,
  );
  const jugadores = jugadoresEnEquipos > 0 ? jugadoresEnEquipos : perfil.youthPlayersCount;

  /**
   * Las cuatro cifras de la portada: lo que una empresa necesita para
   * decidir en medio minuto si esto le interesa. Se cogen las cuatro
   * primeras que el club tenga rellenadas, en el orden que más convence
   * a una empresa local: gente, familias, presencia.
   */
  const cifrasPortada = [
    jugadores != null ? { etiqueta: "Jugadores", valor: formatoNumero.format(jugadores) } : null,
    perfil.youthFamiliesCount != null
      ? { etiqueta: "Familias vinculadas", valor: formatoNumero.format(perfil.youthFamiliesCount) }
      : null,
    perfil.averageAttendance != null
      ? { etiqueta: "Asistencia por partido", valor: formatoNumero.format(perfil.averageAttendance) }
      : null,
    seguidoresTotales > 0
      ? { etiqueta: "Seguidores en redes", valor: formatoNumero.format(seguidoresTotales) }
      : null,
    perfil.estimatedReach != null
      ? { etiqueta: "Alcance estimado", valor: formatoNumero.format(perfil.estimatedReach) }
      : null,
    equipos.length > 0 ? { etiqueta: "Equipos", valor: formatoNumero.format(equipos.length) } : null,
  ]
    .filter((cifra): cifra is { etiqueta: string; valor: string } => cifra !== null)
    .slice(0, 4);

  const masBarata = oportunidades.reduce<number | null>(
    (minimo, oportunidad) => (minimo == null || oportunidad.value < minimo ? oportunidad.value : minimo),
    null,
  );

  const estadisticasAudiencia = [
    perfil.estimatedReach != null
      ? { etiqueta: "Alcance estimado", valor: formatoNumero.format(perfil.estimatedReach) }
      : null,
    perfil.averageAttendance != null
      ? { etiqueta: "Asistencia media", valor: formatoNumero.format(perfil.averageAttendance) }
      : null,
    ...(Object.entries(perfil.followersByNetwork) as [keyof SocialLinks, number | undefined][])
      .filter((entrada): entrada is [keyof SocialLinks, number] => entrada[1] != null)
      .map(([red, valor]) => ({
        etiqueta: `Seguidores en ${ETIQUETA_RED[red]}`,
        valor: formatoNumero.format(valor),
      })),
  ].filter((estadistica): estadistica is { etiqueta: string; valor: string } => estadistica !== null);

  return (
    <Document
      title={`Dossier de patrocinio — ${perfil.name}`}
      author={perfil.name}
      subject="Dossier comercial de patrocinio deportivo"
    >
      {/* Portada: quién es el club y por qué le interesa a una empresa,
          sin pasar de página. */}
      <Page size="A4" style={estilos.paginaPortada}>
        {perfil.coverUrl ? (
          /* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no la de HTML: no admite alt. */
          <Image src={perfil.coverUrl} style={estilos.bandaImagen} />
        ) : (
          <View style={estilos.bandaPortada} />
        )}

        <View style={estilos.cuerpoPortada}>
          <View>
            {perfil.logoUrl ? (
              <View style={estilos.tarjetaLogo}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no la de HTML: no admite alt. */}
                <Image src={perfil.logoUrl} style={estilos.logo} />
              </View>
            ) : (
              <View style={estilos.logoVacio}>
                <Text style={estilos.logoVacioLetra}>{perfil.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <Text style={estilos.portadaEtiqueta}>DOSSIER DE PATROCINIO</Text>
            <Text style={estilos.portadaNombre}>{perfil.name}</Text>
            {(deportes.length > 0 || ubicacion) && (
              <Text style={estilos.portadaDetalle}>
                {[deportes.join(" · "), ubicacion].filter(Boolean).join(" · ")}
              </Text>
            )}

            {perfil.description && (
              <Text style={estilos.portadaResumen}>{recortar(perfil.description, 320)}</Text>
            )}

            {cifrasPortada.length > 0 && (
              <View style={estilos.filaCifras}>
                {cifrasPortada.map((cifra) => (
                  <Cifra key={cifra.etiqueta} etiqueta={cifra.etiqueta} valor={cifra.valor} />
                ))}
              </View>
            )}

            {masBarata != null && (
              <View style={estilos.reclamo}>
                <Text style={estilos.reclamoTexto}>
                  Puedes colaborar con nosotros desde {formatoValorOportunidad.format(masBarata)}
                </Text>
                <Text style={estilos.reclamoDetalle}>
                  {oportunidades.length === 1
                    ? "Tienes el detalle en la página siguiente."
                    : `${oportunidades.length} formas distintas de colaborar, en la página siguiente.`}
                </Text>
              </View>
            )}
          </View>

          <View>
            {/* Prueba social en la portada: que otras empresas ya estén
                dentro es lo que más convence a la que aún no lo está, y
                de paso llena el hueco que quedaba entre el reclamo y el
                pie. */}
            {patrocinadores.length > 0 && (
              <View style={estilos.confianza}>
                <Text style={estilos.confianzaEtiqueta}>YA CONFÍAN EN NOSOTROS</Text>
                <Text style={estilos.confianzaNombres}>
                  {patrocinadores
                    .slice(0, 8)
                    .map((patrocinador) => patrocinador.name)
                    .join("  ·  ")}
                </Text>
              </View>
            )}

            <View style={estilos.portadaPie}>
              <Text style={estilos.marcaApoyaClub}>ApoyaClub</Text>
              <Text style={estilos.marcaApoyaClubSub}>
                Dossier generado el {formatoFecha.format(new Date())} ·{" "}
                {urlPublica.replace(/^https?:\/\//, "")}
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Contenido: fluye automáticamente en tantas páginas como haga falta. */}
      <Page size="A4" style={estilos.paginaContenido}>
        {incluir("identidad") && perfil.description && (
          <Seccion etiqueta="El club" titulo="Quiénes somos">
            <Text style={estilos.parrafo}>{perfil.description}</Text>
            {(perfil.website || redesSociales.length > 0) && (
              <Text style={[estilos.parrafo, { marginBottom: 0 }]}>
                {[perfil.website, ...redesSociales.map(([, url]) => url)]
                  .filter(Boolean)
                  .map((url) => url!.replace(/^https?:\/\//, ""))
                  .join("  ·  ")}
              </Text>
            )}
          </Seccion>
        )}

        {/* Lo que se vende va antes que la historia del club: quien lee
            esto está decidiendo si colabora, no estudiando su pasado. */}
        {oportunidades.length > 0 && (
          <Seccion
            etiqueta="La propuesta"
            titulo="Cómo puedes colaborar"
            descripcion="Formas concretas de patrocinar al club, con su valor."
          >
            {oportunidades.map((oportunidad) => (
              <View key={oportunidad.id} style={estilos.oportunidad} wrap={false}>
                <View style={estilos.oportunidadCabecera}>
                  <Text style={estilos.oportunidadTitulo}>{oportunidad.title}</Text>
                  <Text style={estilos.oportunidadValor}>
                    {formatoValorOportunidad.format(oportunidad.value)}
                  </Text>
                </View>
                {oportunidad.description && (
                  <Text style={[estilos.parrafo, { marginTop: 4, marginBottom: 0 }]}>
                    {oportunidad.description}
                  </Text>
                )}
                {oportunidad.exclusivity && (
                  <Text style={estilos.oportunidadExclusiva}>
                    Exclusiva para el sector {oportunidad.exclusivity}
                  </Text>
                )}
                {oportunidad.duration && (
                  <Text style={estilos.oportunidadDuracion}>{oportunidad.duration}</Text>
                )}
              </View>
            ))}
          </Seccion>
        )}

        {incluir("equipos") && (
          <Seccion etiqueta="A quién llegas" titulo="Equipos">
            <View style={estilos.filaTarjetas}>
              {equipos.map((equipo) => (
                <View key={equipo.id} style={estilos.tarjeta}>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                    {equipo.sport}
                    {equipo.category ? ` · ${equipo.category}` : ""}
                  </Text>
                  <Text style={estilos.tarjetaEtiqueta}>
                    {ETIQUETA_NIVEL_EQUIPO[equipo.teamLevel]}
                    {equipo.gender ? ` · ${equipo.gender}` : ""}
                    {equipo.playerCount != null
                      ? ` · ${formatoNumero.format(equipo.playerCount)} jugadores`
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          </Seccion>
        )}

        {incluir("cantera") && (
          <Seccion
            etiqueta="A quién llegas"
            titulo="Cantera"
            descripcion="Datos agregados de las categorías inferiores del club."
          >
            <View style={estilos.filaTarjetas}>
              {perfil.youthTeamsCount != null && (
                <Tarjeta etiqueta="Equipos" valor={formatoNumero.format(perfil.youthTeamsCount)} />
              )}
              {perfil.youthPlayersCount != null && (
                <Tarjeta etiqueta="Jugadores" valor={formatoNumero.format(perfil.youthPlayersCount)} />
              )}
              {perfil.youthFamiliesCount != null && (
                <Tarjeta etiqueta="Familias" valor={formatoNumero.format(perfil.youthFamiliesCount)} />
              )}
            </View>
          </Seccion>
        )}

        {incluir("audiencia") && (
          <Seccion etiqueta="A quién llegas" titulo="Audiencia en cifras">
            <View style={estilos.filaTarjetas}>
              {estadisticasAudiencia.map((estadistica) => (
                <Tarjeta key={estadistica.etiqueta} etiqueta={estadistica.etiqueta} valor={estadistica.valor} />
              ))}
            </View>
          </Seccion>
        )}

        {incluir("patrocinadores") && (
          <Seccion
            etiqueta="Confían en nosotros"
            titulo="Patrocinadores actuales"
            descripcion="Empresas que ya colaboran con el club."
          >
            {agruparPatrocinadoresPorNivel(patrocinadores).map((grupo) => (
              <View key={grupo.etiqueta} style={{ marginBottom: 8 }}>
                <Text style={estilos.grupoSponsorEtiqueta}>{grupo.etiqueta.toUpperCase()}</Text>
                <View style={estilos.filaSponsors}>
                  {grupo.patrocinadores.map((patrocinador) => (
                    <View key={patrocinador.id} style={estilos.filaSponsor}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no la de HTML: no admite alt. */}
                      {patrocinador.logoUrl && <Image src={patrocinador.logoUrl} style={estilos.logoPequeno} />}
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
                        {patrocinador.name}
                        {patrocinador.sinceYear ? ` (desde ${patrocinador.sinceYear})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </Seccion>
        )}

        {incluir("historia") && (
          <Seccion etiqueta="El club" titulo="Nuestra historia">
            {perfil.foundingYear != null && (
              <Text style={estilos.parrafo}>Fundado en {perfil.foundingYear}.</Text>
            )}
            {perfil.milestones
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((hito, indice) => (
                <View key={`${hito.year}-${indice}`} style={estilos.hito}>
                  <Text style={estilos.hitoAno}>{hito.year}</Text>
                  <Text style={[estilos.parrafo, { marginBottom: 0, flexGrow: 1 }]}>{hito.text}</Text>
                </View>
              ))}
          </Seccion>
        )}

        {incluir("instalaciones") && (perfil.facilities || perfil.facilitiesAddress) && (
          <Seccion etiqueta="El club" titulo="Instalaciones">
            {perfil.facilitiesAddress && (
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
                {perfil.facilitiesAddress}
              </Text>
            )}
            {perfil.facilities && <Text style={estilos.parrafo}>{perfil.facilities}</Text>}
          </Seccion>
        )}

        {/* Una sola vez y destacado: es a lo que tiene que llevar todo lo
            anterior. Antes salía dos veces (en "Quiénes somos" y al final)
            y las dos en gris pequeño, como una nota al pie. */}
        {(emailContacto || (perfil.contactPublicConsent && perfil.contactPhone)) && (
          <View style={estilos.contacto} wrap={false}>
            <Text style={estilos.contactoEtiqueta}>HABLEMOS</Text>
            <Text style={estilos.contactoTitulo}>¿Te interesa colaborar con nosotros?</Text>
            {perfil.contactPublicConsent && perfil.contactName && (
              <Text style={estilos.contactoLinea}>{perfil.contactName}</Text>
            )}
            {emailContacto && <Text style={estilos.contactoLinea}>{emailContacto}</Text>}
            {perfil.contactPublicConsent && perfil.contactPhone && (
              <Text style={estilos.contactoLinea}>{perfil.contactPhone}</Text>
            )}
            {perfil.contactHours && <Text style={estilos.contactoTenue}>{perfil.contactHours}</Text>}
            <Text style={estilos.contactoTenue}>{urlPublica.replace(/^https?:\/\//, "")}</Text>
          </View>
        )}

        <Pie url={urlPublica} />
      </Page>
    </Document>
  );
}

/** Corta un texto por la última palabra entera antes del límite. */
function recortar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const cortado = texto.slice(0, limite);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : limite).trimEnd()}…`;
}
