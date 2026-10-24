import { Fragment } from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  calcularAlcance,
  cifrasDePortada,
  resumenLlano,
  unidadEnTexto,
  type CifraDeAlcance,
} from "@/lib/alcance";
import type { DatosDossier } from "@/lib/dossier-datos";
import { ORDEN_POR_DEFECTO, type BloqueDossier } from "@/lib/dossier-orden";
import { ALTO_LOGO_DOSSIER, ANCHO_LOGO_DOSSIER, logoDelDossier } from "@/lib/dossier-marca";
import {
  cifrasSencillasDeAudiencia,
  deportesDelClub,
  limpiarDireccion,
  redesDelClub,
  seccionesConContenido,
} from "@/lib/dossier";
import {
  enFilas,
  nombresDePortada,
  patrocinadoresDelDossier,
  type GrupoDePatrocinadores,
} from "@/lib/dossier-patrocinadores";
import { precioMasBajo, textoDelPrecio } from "@/lib/format";
import { textosDeDocumento, type TextosDocumento } from "@/lib/textos-documento";
import type { DossierSectionKey } from "@/lib/types";

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
 *
 * Sobre la maqueta (22/10/2026):
 *
 *   - Ningún apartado va entero "sin partir" (`wrap={false}`). Antes sí,
 *     y cuando uno no cabía en una página (diez oportunidades, treinta
 *     patrocinadores) react-pdf lo apretujaba en la que había: las letras
 *     salían unas encima de otras. Ahora lo que no se parte es cada
 *     pieza (una oportunidad, una fila de tarjetas), y el título del
 *     apartado no se queda solo al final de una página.
 *   - Las tarjetas van en rejilla de columnas iguales, con el ancho
 *     calculado, en vez de tantas como quepan: todo queda alineado.
 */

const COLOR_MARCA = "#14304f"; // brand-navy (azul marino de marca)
const COLOR_ACENTO = "#0f766e"; // brand-teal-dark
const COLOR_ACENTO_SUAVE = "#e6f0ee";
const COLOR_FONDO_SUAVE = "#f7f7f8";
const COLOR_TEXTO = "#18181b"; // zinc-900
const COLOR_TEXTO_SUAVE = "#52525b"; // zinc-600
const COLOR_TEXTO_TENUE = "#a1a1aa"; // zinc-400
const COLOR_BORDE = "#e4e4e7"; // zinc-200

/** Márgenes laterales de todas las páginas y el ancho que queda dentro. */
const MARGEN = 48;
const ANCHO_UTIL = 595.28 - MARGEN * 2; // A4 en puntos
const SEPARACION = 10;
/** Lo que tiene que caber debajo de un título para no dejarlo solo. */
const HUECO_BAJO_CABECERA = 130;
/** Lo mismo para el título de un grupo de patrocinadores o de cifras. */
const HUECO_BAJO_SUBTITULO = 110;

/** El ancho de una celda de una rejilla de `columnas` columnas. */
function anchoDeCelda(columnas: number): number {
  return (ANCHO_UTIL - SEPARACION * (columnas - 1)) / columnas;
}

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
    paddingHorizontal: MARGEN,
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
    marginTop: 22,
  },
  portadaNombre: { fontSize: 28, fontFamily: "Helvetica-Bold", marginTop: 6, color: COLOR_MARCA, lineHeight: 1.2 },
  portadaDetalle: { fontSize: 11, color: COLOR_TEXTO_SUAVE, marginTop: 6 },
  portadaResumen: { fontSize: 10.5, color: COLOR_TEXTO, marginTop: 16, lineHeight: 1.55 },

  cifra: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cifraValor: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  cifraEtiqueta: { fontSize: 8, color: COLOR_TEXTO_SUAVE, marginTop: 4, lineHeight: 1.3 },

  reclamo: { marginTop: 22, backgroundColor: COLOR_ACENTO_SUAVE, borderRadius: 8, padding: 16 },
  reclamoTexto: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },
  reclamoDetalle: { fontSize: 9, color: COLOR_TEXTO_SUAVE, marginTop: 4 },

  confianza: { marginTop: 24 },
  confianzaEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: COLOR_TEXTO_TENUE,
    marginBottom: 6,
  },
  confianzaNombres: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO_SUAVE, lineHeight: 1.6 },
  // El pie de la portada es una franja azul marino con el logo de
  // ApoyaClub: el logo nuevo tiene las letras blancas y sobre el blanco
  // de la página no se vería (ver `dossier-marca.ts`).
  portadaPie: {
    marginTop: 24,
    marginBottom: 40,
    backgroundColor: COLOR_MARCA,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marcaApoyaClubLogo: { width: 150, height: (150 * ALTO_LOGO_DOSSIER) / ANCHO_LOGO_DOSSIER },
  marcaApoyaClubTextos: { alignItems: "flex-end", marginLeft: 12, flexShrink: 1 },
  marcaApoyaClubSub: { fontSize: 8, color: "#cbd5e1", textAlign: "right" },
  marcaApoyaClubUrl: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#5eead4", marginTop: 3, textAlign: "right" },

  // -----------------------------------------------------------------
  // Contenido
  // -----------------------------------------------------------------
  paginaContenido: {
    paddingTop: 48,
    paddingHorizontal: MARGEN,
    paddingBottom: 70,
    fontFamily: "Helvetica",
    color: COLOR_TEXTO,
    fontSize: 10,
  },
  // Separaciones con `padding` y no con `margin` por debajo: react-pdf
  // cuenta el margen inferior como si tuviera que caber en la página, y
  // un apartado que cabía justo saltaba entero a la siguiente dejando
  // media página en blanco.
  seccion: { paddingBottom: 30 },
  seccionCabecera: { marginBottom: 6 - HUECO_BAJO_CABECERA },
  seccionEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: COLOR_ACENTO,
    marginBottom: 4,
  },
  seccionTitulo: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  seccionDescripcion: { fontSize: 9, color: COLOR_TEXTO_SUAVE, marginTop: 4, lineHeight: 1.4 },
  seccionRegla: { borderBottomWidth: 2, borderBottomColor: COLOR_ACENTO, width: 32, marginTop: 8 },
  parrafo: { fontSize: 10, lineHeight: 1.55, color: COLOR_TEXTO_SUAVE, marginBottom: 6 },

  fila: { display: "flex", flexDirection: "row", paddingBottom: SEPARACION },
  tarjeta: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tarjetaTitulo: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO, lineHeight: 1.3 },
  tarjetaValor: { fontSize: 17, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  tarjetaEtiqueta: { fontSize: 8, color: COLOR_TEXTO_SUAVE, marginTop: 3, lineHeight: 1.35 },
  tarjetaUnidad: { fontSize: 8, fontFamily: "Helvetica", color: COLOR_TEXTO_SUAVE },
  tarjetaProcedencia: { fontSize: 7, color: COLOR_TEXTO_TENUE, marginTop: 4, lineHeight: 1.35 },
  origenContado: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO, marginTop: 4 },
  red: { borderWidth: 1, borderColor: COLOR_BORDE, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  redNombre: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_MARCA },
  redDireccion: { fontSize: 8, color: COLOR_ACENTO, marginTop: 3, lineHeight: 1.3 },
  redSeguidores: { fontSize: 15, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO, marginTop: 6 },
  redSeguidoresUnidad: { fontSize: 8, fontFamily: "Helvetica", color: COLOR_TEXTO_SUAVE },

  // El resumen en cristiano. Va en un recuadro con el filo de color a
  // la izquierda para que sea lo primero que encuentra el ojo al llegar
  // a la página: quien solo lea esto ya se ha enterado.
  resumenLlano: {
    borderLeftWidth: 3,
    borderLeftColor: COLOR_ACENTO,
    backgroundColor: COLOR_FONDO_SUAVE,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
  },
  separacionTrasResumen: { height: 16 },
  resumenLlanoFrase: { fontSize: 10.5, lineHeight: 1.45, marginBottom: 4 },
  avisoDeOrigen: { fontSize: 7.5, color: COLOR_TEXTO_TENUE, marginTop: 6, fontFamily: "Helvetica-Oblique" },

  hito: { display: "flex", flexDirection: "row", paddingBottom: 8 },
  hitoAno: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO, width: 44 },
  hitoTexto: { fontSize: 10, lineHeight: 1.5, color: COLOR_TEXTO_SUAVE, flex: 1 },

  grupoPatrocinadores: { paddingBottom: 14 },
  grupoEtiqueta: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: COLOR_ACENTO,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDE,
  },
  patrocinadorConLogo: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  cajaLogoPatrocinador: { height: 44, width: "100%", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  logoPatrocinador: { maxHeight: 44, maxWidth: "100%", objectFit: "contain" },
  inicialPatrocinador: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR_ACENTO_SUAVE,
    alignItems: "center",
    justifyContent: "center",
  },
  inicialPatrocinadorLetra: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },
  patrocinadorNombre: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO, textAlign: "center", lineHeight: 1.3 },
  patrocinadorDesde: { fontSize: 7.5, color: COLOR_TEXTO_TENUE, marginTop: 2, textAlign: "center" },
  nombreEnLista: { display: "flex", flexDirection: "row", alignItems: "flex-start" },
  vineta: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLOR_ACENTO, marginTop: 4, marginRight: 6 },
  nombreEnListaTexto: { fontSize: 9, color: COLOR_TEXTO, lineHeight: 1.35, flex: 1 },

  oportunidad: {
    borderWidth: 1,
    borderColor: COLOR_BORDE,
    borderLeftWidth: 3,
    borderLeftColor: COLOR_ACENTO,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  oportunidadCabecera: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // `flex: 1` en el título y `flexShrink: 0` en el precio: con un título
  // largo, antes se metía por debajo del importe.
  oportunidadTitulo: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR_TEXTO, flex: 1, paddingRight: 14, lineHeight: 1.3 },
  oportunidadValor: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO, flexShrink: 0 },
  oportunidadTexto: { fontSize: 9.5, lineHeight: 1.5, color: COLOR_TEXTO_SUAVE, marginTop: 6 },
  oportunidadDetalles: { display: "flex", flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  oportunidadDuracion: { fontSize: 8, color: COLOR_TEXTO_SUAVE, marginRight: 14 },
  oportunidadExclusiva: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLOR_ACENTO },

  instalacionesDireccion: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, color: COLOR_TEXTO },

  // -----------------------------------------------------------------
  // Contacto: la llamada a la acción del documento
  // -----------------------------------------------------------------
  contacto: { backgroundColor: COLOR_MARCA, borderRadius: 8, padding: 22, marginTop: 4 },
  contactoEtiqueta: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, color: "#7fcfc3" },
  contactoTitulo: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 4, marginBottom: 6 },
  contactoLinea: { fontSize: 11, color: "#ffffff", marginTop: 6 },
  contactoTenue: { fontSize: 9, color: "#c7d3e0", marginTop: 8 },

  pie: {
    position: "absolute",
    bottom: 28,
    left: MARGEN,
    right: MARGEN,
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

/** El tipo vive en `dossier-datos.ts`: lo comparten el PDF y el Word. */
export type DatosDossierPdf = DatosDossier;

function Pie({ url, textos }: { url: string; textos: TextosDocumento }) {
  return (
    <View style={estilos.pie} fixed>
      <Text>{url.replace(/^https?:\/\//, "")}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `ApoyaClub · ${textos.t("pagina", { n: pageNumber, total: totalPages })}`}
      />
    </View>
  );
}

/**
 * Una rejilla de columnas iguales. Cada fila va entera a una página (no
 * se parte una tarjeta por la mitad), pero la rejilla sí puede seguir en
 * la siguiente.
 */
function Rejilla({ columnas, celdas }: { columnas: number; celdas: React.ReactNode[] }) {
  const ancho = anchoDeCelda(columnas);
  // Las filas sueltas, sin una caja que las envuelva: cada una salta
  // de página por su cuenta.
  return (
    <>
      {enFilas(celdas, columnas).map((fila, indiceFila) => (
        <View key={indiceFila} style={estilos.fila} wrap={false}>
          {fila.map((celda, indice) => (
            <View key={indice} style={{ width: ancho, marginRight: indice < columnas - 1 ? SEPARACION : 0 }}>
              {celda}
            </View>
          ))}
        </View>
      ))}
    </>
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

/**
 * Una cifra de audiencia, en sencillo: el número con su unidad, qué es,
 * y una etiqueta corta que dice si se ha contado en los partidos o es
 * un dato del club. Antes llevaba debajo una frase de metodología y las
 * cifras iban en tres bloques ("contado", "declarado", "deducido") que
 * costaba entender.
 */
function TarjetaDeAlcance({ cifra, textos }: { cifra: CifraDeAlcance; textos: TextosDocumento }) {
  const { t, tAlcance, numero: formatoNumero } = textos;
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.tarjetaValor}>
        {formatoNumero.format(cifra.valor)}{" "}
        <Text style={estilos.tarjetaUnidad}>{unidadEnTexto(cifra.unidad, cifra.valor, tAlcance)}</Text>
      </Text>
      <Text style={estilos.tarjetaEtiqueta}>{cifra.etiqueta}</Text>
      <Text style={cifra.origen === "contado" ? estilos.origenContado : estilos.tarjetaProcedencia}>
        {cifra.origen === "contado" ? t("origenContado") : t("origenDeclarado")}
      </Text>
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

/**
 * Un apartado del dossier. El apartado se puede partir entre páginas;
 * su cabecera no, y además pide sitio para algo de contenido debajo:
 * así un título nunca se queda solo al pie de una página.
 */
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
    <View style={estilos.seccion}>
      <View style={estilos.seccionCabecera} wrap={false}>
        {etiqueta && <Text style={estilos.seccionEtiqueta}>{etiqueta.toUpperCase()}</Text>}
        <Text style={estilos.seccionTitulo}>{titulo}</Text>
        {descripcion && <Text style={estilos.seccionDescripcion}>{descripcion}</Text>}
        <View style={estilos.seccionRegla} />
        {/* Hueco invisible que va con la cabecera y que el contenido
            vuelve a ocupar (margen negativo de la cabecera): si al pie
            de la página no cabe la cabecera más este hueco, pasa entera
            a la siguiente. `minPresenceAhead` debería hacerlo y en la
            práctica no lo hace. */}
        <View style={{ height: HUECO_BAJO_CABECERA }} />
      </View>
      {children}
    </View>
  );
}

/**
 * Un grupo de patrocinadores: los grandes con su logo en tarjetas, el
 * resto solo con el nombre, en tres columnas. Por orden alfabético
 * (`lib/dossier-patrocinadores.ts`).
 */
function GrupoDePatrocinadoresEnPdf({ grupo, textos }: { grupo: GrupoDePatrocinadores; textos: TextosDocumento }) {
  const { t } = textos;
  const titulo = `${textos.nivelPatrocinador(grupo.etiqueta).toUpperCase()}  ·  ${grupo.patrocinadores.length}`;

  return (
    <View style={estilos.grupoPatrocinadores}>
      <View wrap={false} style={{ marginBottom: -HUECO_BAJO_SUBTITULO }}>
        <Text style={estilos.grupoEtiqueta}>{titulo}</Text>
        <View style={{ height: HUECO_BAJO_SUBTITULO }} />
      </View>
      {grupo.conLogo ? (
        <Rejilla
          columnas={3}
          celdas={grupo.patrocinadores.map((patrocinador) => (
            <View key={patrocinador.id} style={estilos.patrocinadorConLogo}>
              <View style={estilos.cajaLogoPatrocinador}>
                {patrocinador.logoUrl ? (
                  /* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no la de HTML: no admite alt. */
                  <Image src={patrocinador.logoUrl} style={estilos.logoPatrocinador} />
                ) : (
                  <View style={estilos.inicialPatrocinador}>
                    <Text style={estilos.inicialPatrocinadorLetra}>{patrocinador.name.trim().charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={estilos.patrocinadorNombre}>{patrocinador.name}</Text>
              {patrocinador.sinceYear != null && (
                <Text style={estilos.patrocinadorDesde}>{t("desdeAnio", { anio: String(patrocinador.sinceYear) })}</Text>
              )}
            </View>
          ))}
        />
      ) : (
        <Rejilla
          columnas={3}
          celdas={grupo.patrocinadores.map((patrocinador) => (
            <View key={patrocinador.id} style={estilos.nombreEnLista}>
              <View style={estilos.vineta} />
              <Text style={estilos.nombreEnListaTexto}>{patrocinador.name}</Text>
            </View>
          ))}
        />
      )}
    </View>
  );
}

/** Construye el documento y lo renderiza a un Buffer con el PDF final. */
export async function generarDossierPdf(datos: DatosDossierPdf, idioma?: string): Promise<Buffer> {
  const textos = await textosDeDocumento(idioma, "dossier");
  return renderToBuffer(<DossierDocumento {...datos} textos={textos} />);
}

function DossierDocumento({
  perfil,
  equipos,
  patrocinadores,
  oportunidades,
  partidos,
  secciones,
  orden,
  nivelesPatrocinadores,
  emailContacto,
  textos,
}: DatosDossierPdf & { textos: TextosDocumento }) {
  const { t, E, numero: formatoNumero, precio: formatoValorOportunidad } = textos;

  // Solo los niveles de patrocinador que ha elegido el club.
  const gruposPatrocinadores = patrocinadoresDelDossier(patrocinadores, nivelesPatrocinadores ?? null, textos.intlLocale);
  const patrocinadoresElegidos = gruposPatrocinadores.flatMap((grupo) => grupo.patrocinadores);

  const disponibles = seccionesConContenido(perfil, equipos, patrocinadoresElegidos, partidos);
  const incluir = (clave: DossierSectionKey) => secciones.includes(clave) && disponibles.has(clave);

  const deportes = deportesDelClub(equipos).map(E.deporte);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const urlPublica = textos.urlDelClub(perfil.slug);


  /**
   * El alcance del club, calculado en un solo sitio (`lib/alcance.ts`)
   * y compartido con la página "Alcance" del panel.
   *
   * Antes, aquí se sumaban los seguidores de todas las redes en una
   * sola cifra de portada. El padre que sigue al club en Instagram y en
   * Facebook contaba dos veces, y la primera empresa que lo notara
   * dejaba de creerse también lo que sí era cierto. Ahora se enseña la
   * red mayor y nada más.
   */
  const { tAlcance } = textos;
  const alcance = calcularAlcance({ perfil, equipos, partidos }, tAlcance, textos.intlLocale);
  const cifrasPortada = cifrasDePortada(alcance);
  const frasesLlanas = resumenLlano(alcance, tAlcance, textos.intlLocale);

  // Solo cuentan las que tienen precio: una necesidad no puede dejar
  // "desde 0,00 €" en la portada.
  const masBarata = precioMasBajo(oportunidades);

  // En la portada, solo si el club ha decidido enseñar sus patrocinadores.
  const portadaPatrocinadores = incluir("patrocinadores") ? nombresDePortada(gruposPatrocinadores) : null;

  // "Redes sociales": cada red con su dirección y sus seguidores. Sale
  // con "Quiénes somos" o con "Audiencia", que son de donde venían esos
  // datos antes de tener apartado propio.
  const redes = redesDelClub(perfil);
  const verRedes =
    (secciones.includes("identidad") || secciones.includes("audiencia")) && (redes.length > 0 || !!perfil.website);
  const cifrasAudiencia = cifrasSencillasDeAudiencia(alcance);

  // Cada apartado, listo para colocarlo donde diga el orden. Los que no
  // van (sin marcar o sin datos) quedan en `false` y no pintan nada.
  const bloquesDelDossier: Record<BloqueDossier, React.ReactNode> = {
    identidad: (
      <>
        {incluir("identidad") && perfil.description && (
          <Seccion etiqueta={t("elClub")} titulo={t("quienesSomos")}>
            <Text style={estilos.parrafo}>{perfil.description}</Text>
          </Seccion>
        )}
      </>
    ),
    historia: (
      <>
        {incluir("historia") && (
          <Seccion etiqueta={t("elClub")} titulo={t("historia")}>
            {perfil.foundingYear != null && (
              <Text style={estilos.parrafo}>{t("fundado", { anio: String(perfil.foundingYear) })}</Text>
            )}
            {perfil.milestones
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((hito, indice) => (
                <View key={`${hito.year}-${indice}`} style={estilos.hito} wrap={false}>
                  <Text style={estilos.hitoAno}>{hito.year}</Text>
                  <Text style={estilos.hitoTexto}>{hito.text}</Text>
                </View>
              ))}
          </Seccion>
        )}
      </>
    ),
    instalaciones: (
      <>
        {incluir("instalaciones") && (perfil.facilities || perfil.facilitiesAddress) && (
          <Seccion etiqueta={t("elClub")} titulo={t("instalaciones")}>
            {perfil.facilitiesAddress && (
              <Text style={estilos.instalacionesDireccion}>{perfil.facilitiesAddress}</Text>
            )}
            {perfil.facilities && <Text style={estilos.parrafo}>{perfil.facilities}</Text>}
          </Seccion>
        )}
      </>
    ),
    oportunidades: (
      <>
        {oportunidades.length > 0 && (
          <Seccion
            etiqueta={t("propuesta")}
            titulo={t("comoColaborar")}
            descripcion={t("comoColaborarTexto")}
          >
            {oportunidades.map((oportunidad) => (
              <View key={oportunidad.id} style={estilos.oportunidad} wrap={false}>
                <View style={estilos.oportunidadCabecera}>
                  <Text style={estilos.oportunidadTitulo}>{oportunidad.title}</Text>
                  <Text style={estilos.oportunidadValor}>
                    {textoDelPrecio(oportunidad, formatoValorOportunidad, textos.textosPrecio)}
                  </Text>
                </View>
                {oportunidad.description && (
                  <Text style={estilos.oportunidadTexto}>{oportunidad.description}</Text>
                )}
                {(oportunidad.duration || oportunidad.exclusivity) && (
                  <View style={estilos.oportunidadDetalles}>
                    {oportunidad.duration && (
                      <Text style={estilos.oportunidadDuracion}>{oportunidad.duration}</Text>
                    )}
                    {oportunidad.exclusivity && (
                      <Text style={estilos.oportunidadExclusiva}>
                        {t("exclusiva", { sector: oportunidad.exclusivity })}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </Seccion>
        )}
      </>
    ),
    equipos: (
      <>
        {incluir("equipos") && (
          <Seccion etiqueta={t("aQuienLlegas")} titulo={t("equipos")}>
            <Rejilla
              columnas={3}
              celdas={equipos.map((equipo) => (
                <View key={equipo.id} style={estilos.tarjeta}>
                  <Text style={estilos.tarjetaTitulo}>
                    {E.deporte(equipo.sport)}
                    {equipo.category ? ` · ${equipo.category}` : ""}
                  </Text>
                  <Text style={estilos.tarjetaEtiqueta}>
                    {[E.nivelEquipo(equipo.teamLevel), equipo.gender ? textos.sexo(equipo.gender) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  {equipo.playerCount != null && (
                    <Text style={estilos.tarjetaEtiqueta}>{t("jugadores", { n: equipo.playerCount })}</Text>
                  )}
                </View>
              ))}
            />
          </Seccion>
        )}
      </>
    ),
    cantera: (
      <>
        {incluir("cantera") && (
          <Seccion
            etiqueta={t("aQuienLlegas")}
            titulo={t("cantera")}
            descripcion={t("canteraTexto")}
          >
            <Rejilla
              columnas={3}
              celdas={[
                perfil.youthTeamsCount != null && (
                  <Tarjeta key="equipos" etiqueta={t("tarjetaEquipos")} valor={formatoNumero.format(perfil.youthTeamsCount)} />
                ),
                perfil.youthPlayersCount != null && (
                  <Tarjeta key="jugadores" etiqueta={t("tarjetaJugadores")} valor={formatoNumero.format(perfil.youthPlayersCount)} />
                ),
                perfil.youthFamiliesCount != null && (
                  <Tarjeta key="familias" etiqueta={t("tarjetaFamilias")} valor={formatoNumero.format(perfil.youthFamiliesCount)} />
                ),
              ].filter(Boolean)}
            />
          </Seccion>
        )}
      </>
    ),
    audiencia: (
      <>
        {incluir("audiencia") && alcance.hayCifras && (frasesLlanas.length > 0 || cifrasAudiencia.length > 0) && (
          <Seccion
            etiqueta={t("aQuienLlegas")}
            titulo={t("audiencia")}
            descripcion={t("audienciaTexto")}
          >
            {/* Primero en cristiano, y debajo las cifras una a una, cada
                una con una etiqueta corta de dónde sale. Quien abre esto
                suele ser el dueño de un comercio decidiendo en dos
                minutos, no un director de marketing. */}
            {frasesLlanas.length > 0 && (
              <View style={estilos.resumenLlano} wrap={false}>
                {frasesLlanas.map((frase) => (
                  <Text key={frase} style={estilos.resumenLlanoFrase}>
                    {frase}
                  </Text>
                ))}
              </View>
            )}
            {frasesLlanas.length > 0 && <View style={estilos.separacionTrasResumen} />}

            <Rejilla
              columnas={3}
              celdas={cifrasAudiencia.map((cifra) => (
                <TarjetaDeAlcance key={cifra.id} cifra={cifra} textos={textos} />
              ))}
            />
            <Text style={estilos.avisoDeOrigen}>{tAlcance("avisoDeOrigen")}</Text>
          </Seccion>
        )}
      </>
    ),
    patrocinadores: (
      <>
        {incluir("patrocinadores") && (
          <Seccion
            etiqueta={t("confian")}
            titulo={t("patrocinadores")}
            descripcion={t("patrocinadoresTexto")}
          >
            {gruposPatrocinadores.map((grupo) => (
              <GrupoDePatrocinadoresEnPdf key={grupo.etiqueta} grupo={grupo} textos={textos} />
            ))}
          </Seccion>
        )}
      </>
    ),
  };

  // "Redes sociales" no es una sección con casilla: va pegada a
  // "Identidad" (quiénes somos y cómo encontrarnos) y, si esa no va, a
  // "Audiencia", que es donde cuentan los seguidores.
  const bloqueRedes = (
    <>
      {verRedes && (
        <Seccion etiqueta={t("elClub")} titulo={t("redes")} descripcion={t("redesTexto")}>
          <Rejilla
            columnas={3}
            celdas={[
              ...(perfil.website
                ? [
                    <View key="web" style={estilos.red}>
                      <Text style={estilos.redNombre}>{t("web")}</Text>
                      <Text style={estilos.redDireccion}>{limpiarDireccion(perfil.website)}</Text>
                    </View>,
                  ]
                : []),
              ...redes.map((red) => (
                <View key={red.red} style={estilos.red}>
                  <Text style={estilos.redNombre}>{red.nombre}</Text>
                  {red.direccion && <Text style={estilos.redDireccion}>{red.direccion}</Text>}
                  {red.seguidores != null && (
                    <Text style={estilos.redSeguidores}>
                      {formatoNumero.format(red.seguidores)}{" "}
                      <Text style={estilos.redSeguidoresUnidad}>{t("seguidores", { n: red.seguidores })}</Text>
                    </Text>
                  )}
                </View>
              )),
            ]}
          />
        </Seccion>
      )}
    </>
  );
  const ordenBloques = orden ?? ORDEN_POR_DEFECTO;
  const bloqueDeLasRedes: BloqueDossier = secciones.includes("identidad") ? "identidad" : "audiencia";

  return (
    <Document
      title={t("tituloDocumento", { club: perfil.name })}
      author={perfil.name}
      subject={t("asunto")}
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

            <Text style={estilos.portadaEtiqueta}>{t("portada").toUpperCase()}</Text>
            <Text style={estilos.portadaNombre}>{perfil.name}</Text>
            {(deportes.length > 0 || ubicacion) && (
              <Text style={estilos.portadaDetalle}>
                {[deportes.join(" · "), ubicacion].filter(Boolean).join(" · ")}
              </Text>
            )}

            {perfil.description && (
              <Text style={estilos.portadaResumen}>{recortar(perfil.description, 300)}</Text>
            )}

            {cifrasPortada.length > 0 && (
              <View style={{ marginTop: 22 }}>
                <Rejilla
                  columnas={4}
                  celdas={cifrasPortada.map((cifra) => (
                    <Cifra key={cifra.id} etiqueta={cifra.etiqueta} valor={formatoNumero.format(cifra.valor)} />
                  ))}
                />
              </View>
            )}

            {oportunidades.length > 0 && (
              <View style={estilos.reclamo}>
                <Text style={estilos.reclamoTexto}>
                  {masBarata != null
                    ? t("desde", { precio: formatoValorOportunidad.format(masBarata) })
                    : t("desdeSinPrecio")}
                </Text>
                <Text style={estilos.reclamoDetalle}>
                  {t("detalleSiguiente", { n: oportunidades.length })}
                </Text>
              </View>
            )}
          </View>

          <View>
            {/* Prueba social en la portada: que otras empresas ya estén
                dentro es lo que más convence a la que aún no lo está. Las
                de más nivel primero, y como mucho ocho nombres. */}
            {portadaPatrocinadores && portadaPatrocinadores.nombres.length > 0 && (
              <View style={estilos.confianza}>
                <Text style={estilos.confianzaEtiqueta}>{t("yaConfian").toUpperCase()}</Text>
                <Text style={estilos.confianzaNombres}>
                  {portadaPatrocinadores.nombres.join("   ·   ")}
                  {portadaPatrocinadores.resto > 0 ? `   ·   ${t("yMas", { n: portadaPatrocinadores.resto })}` : ""}
                </Text>
              </View>
            )}

            <View style={estilos.portadaPie}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf no tiene `alt` */}
              <Image src={logoDelDossier(textos.locale)} style={estilos.marcaApoyaClubLogo} />
              <View style={estilos.marcaApoyaClubTextos}>
                <Text style={estilos.marcaApoyaClubSub}>{t("generado", { fecha: textos.fechaLarga(new Date()) })}</Text>
                <Text style={estilos.marcaApoyaClubUrl}>{urlPublica.replace(/^https?:\/\//, "")}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* Contenido: fluye automáticamente en tantas páginas como haga falta. */}
      <Page size="A4" style={estilos.paginaContenido}>
        {/* Los apartados, en el orden que ha elegido el club
            (`lib/dossier-orden.ts`). Por defecto: primero quién es el
            club, luego qué ofrece, a quién llega y quién confía ya en él.
            El contacto cierra siempre, aquí debajo. */}
        {ordenBloques.map((bloque) => (
          <Fragment key={bloque}>
            {bloquesDelDossier[bloque]}
            {bloque === bloqueDeLasRedes && bloqueRedes}
          </Fragment>
        ))}

        {/* Una sola vez y destacado: es a lo que tiene que llevar todo lo
            anterior. Antes salía dos veces (en "Quiénes somos" y al final)
            y las dos en gris pequeño, como una nota al pie. */}
        {(emailContacto || (perfil.contactPublicConsent && perfil.contactPhone)) && (
          <View style={estilos.contacto} wrap={false}>
            <Text style={estilos.contactoEtiqueta}>{t("hablemos").toUpperCase()}</Text>
            <Text style={estilos.contactoTitulo}>{t("teInteresa")}</Text>
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

        <Pie url={urlPublica} textos={textos} />
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
