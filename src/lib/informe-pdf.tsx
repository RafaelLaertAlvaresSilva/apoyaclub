import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { fraseDeResumen, type ResumenInforme } from "@/lib/informe-patrocinio";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { fechaLegible, type TareaPatrocinio } from "@/lib/tareas-patrocinio";
import type { ClubProfile } from "@/lib/types";

/**
 * El informe de patrocinio en PDF: lo que el club le entrega a la
 * empresa al acabar la temporada, o a mitad.
 *
 * Es un documento corto a propósito —cabe en una página— porque quien
 * lo abre no está estudiando nada: está comprobando en treinta segundos
 * si lo que pagó valió la pena. Todo lo que estorbe a esa comprobación
 * sobra.
 */

const COLOR_MARCA = "#14304f";
const COLOR_ACENTO = "#0f766e";
const COLOR_TEXTO = "#18181b";
const COLOR_TEXTO_SUAVE = "#52525b";
const COLOR_TEXTO_TENUE = "#a1a1aa";
const COLOR_BORDE = "#e4e4e7";

const estilos = StyleSheet.create({
  pagina: { paddingTop: 0, paddingBottom: 48, fontFamily: "Helvetica", color: COLOR_TEXTO },
  banda: { backgroundColor: COLOR_MARCA, paddingHorizontal: 40, paddingVertical: 24 },
  bandaFila: { flexDirection: "row", alignItems: "center", gap: 14 },
  logo: { width: 46, height: 46, objectFit: "contain" },
  bandaEtiqueta: { fontSize: 8, color: "#93b4d1", letterSpacing: 1.5, fontFamily: "Helvetica-Bold" },
  bandaClub: { fontSize: 13, color: "#ffffff", fontFamily: "Helvetica-Bold", marginTop: 2 },
  cuerpo: { paddingHorizontal: 40, paddingTop: 26 },
  empresaEtiqueta: { fontSize: 8, color: COLOR_ACENTO, letterSpacing: 1.5, fontFamily: "Helvetica-Bold" },
  empresa: { fontSize: 24, fontFamily: "Helvetica-Bold", color: COLOR_MARCA, marginTop: 4 },
  periodo: { fontSize: 9, color: COLOR_TEXTO_SUAVE, marginTop: 4 },
  resumen: { fontSize: 12, color: COLOR_TEXTO, marginTop: 16, lineHeight: 1.4 },
  filaCifras: { flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 8 },
  cifra: { flexGrow: 1, borderWidth: 1, borderColor: COLOR_BORDE, borderRadius: 4, padding: 10 },
  cifraValor: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  cifraEtiqueta: { fontSize: 7.5, color: COLOR_TEXTO_SUAVE, marginTop: 2 },
  seccion: { marginTop: 20 },
  seccionTitulo: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  seccionRegla: { borderBottomWidth: 2, borderBottomColor: COLOR_ACENTO, width: 28, marginTop: 5, marginBottom: 10 },
  linea: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  // Un punto dibujado y no un carácter: la fuente base de un PDF
  // (Helvetica) no trae ✓ ni ✗, y esos glifos salían en blanco.
  punto: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  columnaMarca: { width: 12, alignItems: "flex-start" },
  lineaCuerpo: { flexGrow: 1, flexShrink: 1 },
  lineaTitulo: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  lineaDetalle: { fontSize: 8.5, color: COLOR_TEXTO_SUAVE, marginTop: 1.5 },
  lineaEnlace: { fontSize: 8.5, color: COLOR_ACENTO, marginTop: 1.5 },
  cierre: { marginTop: 26, backgroundColor: COLOR_MARCA, borderRadius: 6, padding: 18 },
  cierreTitulo: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  cierreTexto: { fontSize: 9, color: "#c7d8e6", marginTop: 5, lineHeight: 1.4 },
  cierreLinea: { fontSize: 9.5, color: "#ffffff", marginTop: 6 },
  pie: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDE,
    paddingTop: 8,
    fontSize: 7.5,
    color: COLOR_TEXTO_TENUE,
  },
});

export type DatosInforme = {
  perfil: ClubProfile;
  informe: ResumenInforme;
  emailContacto: string | null;
};

export async function generarInformePdf(datos: DatosInforme): Promise<Buffer> {
  return renderToBuffer(<InformeDocumento {...datos} />);
}

function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <View style={estilos.cifra}>
      <Text style={estilos.cifraValor}>{valor}</Text>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function Linea({ tarea, color }: { tarea: TareaPatrocinio; color: string }) {
  return (
    <View style={estilos.linea} wrap={false}>
      <View style={estilos.columnaMarca}>
        <View style={[estilos.punto, { backgroundColor: color }]} />
      </View>
      <View style={estilos.lineaCuerpo}>
        <Text style={estilos.lineaTitulo}>{tarea.accion}</Text>
        <Text style={estilos.lineaDetalle}>
          {tarea.inicio && `Del ${fechaLegible(tarea.inicio)} al `}
          {!tarea.inicio && "Fecha: "}
          {fechaLegible(tarea.fin)}
          {tarea.notas ? ` · ${tarea.notas}` : ""}
        </Text>
        {tarea.pruebaUrl && (
          <Text style={estilos.lineaEnlace}>{tarea.pruebaUrl.replace(/^https?:\/\//, "")}</Text>
        )}
      </View>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
      <View style={estilos.seccionRegla} />
      {children}
    </View>
  );
}

function InformeDocumento({ perfil, informe, emailContacto }: DatosInforme) {
  const urlPublica = `${SITE_URL}/${routing.defaultLocale}/club/${perfil.slug}`;
  const urlLimpia = urlPublica.replace(/^https?:\/\//, "");

  const periodo =
    informe.desde && informe.hasta
      ? informe.desde === informe.hasta
        ? fechaLegible(informe.desde)
        : `Del ${fechaLegible(informe.desde)} al ${fechaLegible(informe.hasta)}`
      : null;

  return (
    <Document
      title={`Informe de patrocinio — ${informe.empresa}`}
      author={perfil.name}
      subject={`Acciones realizadas para ${informe.empresa}`}
    >
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.banda}>
          <View style={estilos.bandaFila}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no la de HTML. */}
            {perfil.logoUrl && <Image src={perfil.logoUrl} style={estilos.logo} />}
            <View>
              <Text style={estilos.bandaEtiqueta}>INFORME DE PATROCINIO</Text>
              <Text style={estilos.bandaClub}>{perfil.name}</Text>
            </View>
          </View>
        </View>

        <View style={estilos.cuerpo}>
          <Text style={estilos.empresaEtiqueta}>LO QUE HEMOS HECHO POR</Text>
          <Text style={estilos.empresa}>{informe.empresa}</Text>
          {periodo && <Text style={estilos.periodo}>{periodo}</Text>}

          <Text style={estilos.resumen}>{fraseDeResumen(informe)}</Text>

          <View style={estilos.filaCifras}>
            <Cifra valor={informe.total} etiqueta="Acciones acordadas" />
            <Cifra valor={informe.cumplidas.length} etiqueta="Ya cumplidas" />
            <Cifra valor={informe.conPrueba} etiqueta="Con enlace o prueba" />
          </View>

          {informe.cumplidas.length > 0 && (
            <Seccion titulo={`Hecho (${informe.cumplidas.length})`}>
              {informe.cumplidas.map((tarea) => (
                <Linea key={tarea.id} tarea={tarea} color={COLOR_ACENTO} />
              ))}
            </Seccion>
          )}

          {informe.enMarcha.length > 0 && (
            <Seccion titulo={`En marcha (${informe.enMarcha.length})`}>
              {informe.enMarcha.map((tarea) => (
                <Linea key={tarea.id} tarea={tarea} color={COLOR_TEXTO_TENUE} />
              ))}
            </Seccion>
          )}

          {/* Lo que falta va dentro, no escondido: un informe que oculta
              lo pendiente se cae en cuanto el empresario se acuerda de
              la publicación que nunca vio. */}
          {informe.vencidas.length > 0 && (
            <Seccion titulo={`Pendiente, fuera de plazo (${informe.vencidas.length})`}>
              {informe.vencidas.map((tarea) => (
                <Linea key={tarea.id} tarea={tarea} color="#b91c1c" />
              ))}
            </Seccion>
          )}

          <View style={estilos.cierre} wrap={false}>
            <Text style={estilos.cierreTitulo}>Gracias por apoyar el deporte de tu barrio</Text>
            <Text style={estilos.cierreTexto}>
              Tu apoyo se ve cada semana en la pista y en cada familia que forma parte del club. Si
              quieres seguir la temporada que viene, o cambiar algo de lo acordado, hablamos cuando
              te venga bien.
            </Text>
            {perfil.contactPublicConsent && perfil.contactName && (
              <Text style={estilos.cierreLinea}>{perfil.contactName}</Text>
            )}
            {emailContacto && <Text style={estilos.cierreLinea}>{emailContacto}</Text>}
            {perfil.contactPublicConsent && perfil.contactPhone && (
              <Text style={estilos.cierreLinea}>{perfil.contactPhone}</Text>
            )}
          </View>
        </View>

        <View style={estilos.pie} fixed>
          <Text>{urlLimpia}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `ApoyaClub · página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
