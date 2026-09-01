import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
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
 */

const COLOR_MARCA = "#047857"; // emerald-700
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
  paginaPortada: {
    padding: 48,
    fontFamily: "Helvetica",
    color: COLOR_TEXTO,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  paginaContenido: {
    padding: 40,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    color: COLOR_TEXTO,
    fontSize: 10,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 8,
    objectFit: "cover",
    marginBottom: 20,
  },
  portadaEtiqueta: {
    fontSize: 11,
    color: COLOR_MARCA,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  portadaNombre: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  portadaDetalle: {
    fontSize: 12,
    color: COLOR_TEXTO_SUAVE,
    marginBottom: 4,
  },
  portadaPie: {
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDE,
    paddingTop: 14,
  },
  marcaApoyaClub: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR_MARCA,
  },
  marcaApoyaClubSub: {
    fontSize: 9,
    color: COLOR_TEXTO_TENUE,
    marginTop: 2,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLOR_TEXTO,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDE,
    paddingBottom: 6,
  },
  seccionDescripcion: {
    fontSize: 9,
    color: COLOR_TEXTO_TENUE,
    marginBottom: 8,
  },
  parrafo: {
    fontSize: 10,
    color: COLOR_TEXTO_SUAVE,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  filaTarjetas: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tarjeta: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  tarjetaValor: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR_TEXTO,
  },
  tarjetaEtiqueta: {
    fontSize: 8,
    color: COLOR_TEXTO_TENUE,
    marginTop: 2,
  },
  filaOportunidad: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  filaOportunidadCabecera: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  oportunidadTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    paddingRight: 8,
  },
  oportunidadValor: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR_MARCA,
  },
  oportunidadDuracion: {
    fontSize: 8,
    color: COLOR_TEXTO_TENUE,
    marginTop: 4,
  },
  hito: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 5,
  },
  hitoAno: {
    width: 42,
    fontFamily: "Helvetica-Bold",
    color: COLOR_MARCA,
    fontSize: 10,
  },
  logoPequeno: {
    width: 28,
    height: 28,
    borderRadius: 4,
    objectFit: "cover",
    marginRight: 8,
  },
  filaSponsor: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    width: "48%",
  },
  filaSponsors: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
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

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={estilos.seccion} wrap={false}>
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
      {descripcion && <Text style={estilos.seccionDescripcion}>{descripcion}</Text>}
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
      author="ApoyaClub"
      subject="Dossier comercial de patrocinio deportivo"
    >
      {/* Portada: marca del club, siempre presente. */}
      <Page size="A4" style={estilos.paginaPortada}>
        <View>
          {perfil.logoUrl && <Image src={perfil.logoUrl} style={estilos.logo} />}
          <Text style={estilos.portadaEtiqueta}>Dossier de patrocinio</Text>
          <Text style={estilos.portadaNombre}>{perfil.name}</Text>
          {(deportes.length > 0 || ubicacion) && (
            <Text style={estilos.portadaDetalle}>
              {[deportes.join(" · "), ubicacion].filter(Boolean).join(" · ")}
            </Text>
          )}
          <Text style={estilos.portadaDetalle}>
            Generado el {formatoFecha.format(new Date())}
          </Text>
        </View>
        <View style={estilos.portadaPie}>
          <Text style={estilos.marcaApoyaClub}>ApoyaClub</Text>
          <Text style={estilos.marcaApoyaClubSub}>
            La plataforma que conecta clubes deportivos con empresas patrocinadoras — {urlPublica}
          </Text>
        </View>
      </Page>

      {/* Contenido: fluye automáticamente en tantas páginas como haga falta. */}
      <Page size="A4" style={estilos.paginaContenido}>
        {incluir("identidad") && (
          <Seccion titulo="Quiénes somos">
            {perfil.description && <Text style={estilos.parrafo}>{perfil.description}</Text>}
            {(perfil.website || redesSociales.length > 0) && (
              <Text style={estilos.parrafo}>
                {[perfil.website, ...redesSociales.map(([, url]) => url)]
                  .filter(Boolean)
                  .map((url) => url!.replace(/^https?:\/\//, ""))
                  .join("  ·  ")}
              </Text>
            )}
            {(emailContacto || (perfil.contactPublicConsent && perfil.contactPhone)) && (
              <View style={{ marginTop: 4 }}>
                {perfil.contactPublicConsent && perfil.contactName && (
                  <Text style={estilos.parrafo}>{perfil.contactName}</Text>
                )}
                {emailContacto && <Text style={estilos.parrafo}>{emailContacto}</Text>}
                {perfil.contactPublicConsent && perfil.contactPhone && (
                  <Text style={estilos.parrafo}>{perfil.contactPhone}</Text>
                )}
              </View>
            )}
          </Seccion>
        )}

        {incluir("historia") && (
          <Seccion titulo="Nuestra historia">
            {perfil.foundingYear != null && (
              <Text style={estilos.parrafo}>Fundado en {perfil.foundingYear}.</Text>
            )}
            {perfil.milestones
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((hito, indice) => (
                <View key={`${hito.year}-${indice}`} style={estilos.hito}>
                  <Text style={estilos.hitoAno}>{hito.year}</Text>
                  <Text style={estilos.parrafo}>{hito.text}</Text>
                </View>
              ))}
          </Seccion>
        )}

        {incluir("equipos") && (
          <Seccion titulo="Equipos">
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
          <Seccion titulo="Cantera" descripcion="Datos agregados de las categorías inferiores del club.">
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
          <Seccion titulo="Audiencia en cifras">
            <View style={estilos.filaTarjetas}>
              {estadisticasAudiencia.map((estadistica) => (
                <Tarjeta key={estadistica.etiqueta} etiqueta={estadistica.etiqueta} valor={estadistica.valor} />
              ))}
            </View>
          </Seccion>
        )}

        {incluir("instalaciones") && perfil.facilities && (
          <Seccion titulo="Instalaciones">
            <Text style={estilos.parrafo}>{perfil.facilities}</Text>
          </Seccion>
        )}

        {incluir("patrocinadores") && (
          <Seccion titulo="Patrocinadores actuales">
            <View style={estilos.filaSponsors}>
              {patrocinadores.map((patrocinador) => (
                <View key={patrocinador.id} style={estilos.filaSponsor}>
                  {patrocinador.logoUrl && <Image src={patrocinador.logoUrl} style={estilos.logoPequeno} />}
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{patrocinador.name}</Text>
                </View>
              ))}
            </View>
          </Seccion>
        )}

        {oportunidades.length > 0 && (
          <Seccion
            titulo="Oportunidades de patrocinio"
            descripcion="Formas concretas de colaborar con el club."
          >
            {oportunidades.map((oportunidad) => (
              <View key={oportunidad.id} style={estilos.filaOportunidad} wrap={false}>
                <View style={estilos.filaOportunidadCabecera}>
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
                {oportunidad.duration && (
                  <Text style={estilos.oportunidadDuracion}>{oportunidad.duration}</Text>
                )}
              </View>
            ))}
          </Seccion>
        )}

        {emailContacto && (
          <Seccion titulo="Contacto">
            <Text style={estilos.parrafo}>
              {[perfil.contactPublicConsent ? perfil.contactName : null, emailContacto, perfil.contactPublicConsent ? perfil.contactPhone : null]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
          </Seccion>
        )}

        <Pie url={urlPublica} />
      </Page>
    </Document>
  );
}
