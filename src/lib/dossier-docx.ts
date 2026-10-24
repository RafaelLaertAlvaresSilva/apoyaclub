import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  cifrasSencillasDeAudiencia,
  deportesDelClub,
  limpiarDireccion,
  redesDelClub,
  seccionesConContenido,
} from "@/lib/dossier";
import {
  calcularAlcance,
  cifrasDePortada,
  resumenLlano,
  unidadEnTexto,
} from "@/lib/alcance";
import type { DatosDossier } from "@/lib/dossier-datos";
import { ORDEN_POR_DEFECTO, type BloqueDossier } from "@/lib/dossier-orden";
import { ALTO_LOGO_DOSSIER, ANCHO_LOGO_DOSSIER, logoDelDossier } from "@/lib/dossier-marca";
import {
  enFilas,
  nombresDePortada,
  patrocinadoresDelDossier,
  type GrupoDePatrocinadores,
} from "@/lib/dossier-patrocinadores";
import { descargarImagen, encajarEn, type ImagenDescargada } from "@/lib/imagenes-remotas";
import { textosDeDocumento, type TextosDocumento } from "@/lib/textos-documento";
import type { DossierSectionKey } from "@/lib/types";

/**
 * El mismo dossier que el PDF, pero en Word (.docx).
 *
 * El PDF es lo que se manda a una empresa: cerrado, con la maqueta
 * intacta, igual en cualquier pantalla. El Word es para el club: para
 * cambiarle una frase, meter la foto del equipo de este año o mover la
 * página de patrocinadores antes que la de instalaciones sin tener que
 * pedírselo a nadie.
 *
 * Cómo va montado:
 *
 *   - Cada apartado es un Título 1 real, así que sale en el panel de
 *     navegación de Word y se puede arrastrar entero a otro sitio. El
 *     título se queda pegado a lo que viene debajo ("conservar con el
 *     siguiente"): nunca queda solo al pie de una página.
 *   - El texto corrido va en párrafos normales, para que fluya al
 *     editarlo.
 *   - Lo que es una lista de cosas (oportunidades, equipos, cifras,
 *     patrocinadores) va en tablas sencillas. Antes iba todo seguido en
 *     párrafos y era una sola mancha de texto; en tabla cada cosa tiene
 *     su sitio, y una tabla de Word se edita igual de fácil. Las filas
 *     no se parten entre dos páginas.
 *   - Las imágenes van empotradas y con su proporción respetada: se
 *     pueden seleccionar, mover y sustituir como cualquier otra.
 */

const NAVY = "14304F";
const TEAL = "0F766E";
const TEAL_SUAVE = "E6F0EE";
const FONDO_SUAVE = "F7F7F8";
const GRIS = "52525B";
const GRIS_TENUE = "A1A1AA";
const BORDE = "E4E4E7";
const BLANCO = "FFFFFF";

/** Ancho útil de una A4 con márgenes de 2 cm, en vigésimas de punto (twips). */
const ANCHO_UTIL_TWIPS = 11906 - 1134 * 2;
/** El mismo ancho en píxeles, para las imágenes. */
const ANCHO_UTIL = 640;

type Alineacion = (typeof AlignmentType)[keyof typeof AlignmentType];

const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: BLANCO };
const BORDE_FINO = { style: BorderStyle.SINGLE, size: 4, color: BORDE };
const SIN_BORDES = {
  top: SIN_BORDE,
  bottom: SIN_BORDE,
  left: SIN_BORDE,
  right: SIN_BORDE,
  insideHorizontal: SIN_BORDE,
  insideVertical: SIN_BORDE,
};

function recortar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const cortado = texto.slice(0, limite);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : limite).trimEnd()}…`;
}

type OpcionesParrafo = {
  color?: string;
  tamano?: number;
  negrita?: boolean;
  espacioAntes?: number;
  espacioDespues?: number;
  alineacion?: Alineacion;
  conElSiguiente?: boolean;
  interlineado?: number;
};

function parrafo(texto: string, opciones: OpcionesParrafo = {}) {
  return new Paragraph({
    alignment: opciones.alineacion,
    keepNext: opciones.conElSiguiente,
    spacing: {
      before: opciones.espacioAntes ?? 0,
      after: opciones.espacioDespues ?? 120,
      line: opciones.interlineado ?? 300,
    },
    children: [
      new TextRun({
        text: texto,
        size: opciones.tamano ?? 21,
        bold: opciones.negrita,
        color: opciones.color ?? "18181B",
      }),
    ],
  });
}

function antetitulo(texto: string, espacioAntes = 0) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: espacioAntes, after: 60 },
    children: [new TextRun({ text: texto.toUpperCase(), size: 16, bold: true, color: TEAL, characterSpacing: 20 })],
  });
}

/**
 * La cabecera de un apartado: antetítulo, Título 1 con una raya de color
 * debajo y, si la hay, una línea que explica el apartado. Todo "pegado
 * al siguiente", para que nunca quede suelto al final de una página.
 */
function cabecera(etiqueta: string | null, texto: string, descripcion?: string): Paragraph[] {
  const bloque: Paragraph[] = [];
  if (etiqueta) bloque.push(antetitulo(etiqueta, 360));
  bloque.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      keepNext: true,
      spacing: { before: etiqueta ? 0 : 360, after: descripcion ? 80 : 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 4 } },
      text: texto,
    }),
  );
  if (descripcion) {
    bloque.push(parrafo(descripcion, { color: GRIS, tamano: 18, espacioAntes: 80, espacioDespues: 200, conElSiguiente: true }));
  }
  return bloque;
}

function imagen(img: ImagenDescargada, ancho: number, alto: number, alineacion?: Alineacion, espacioDespues = 160) {
  return new Paragraph({
    alignment: alineacion,
    spacing: { after: espacioDespues },
    children: [new ImageRun({ type: img.tipo, data: img.data, transformation: { width: ancho, height: alto } })],
  });
}

function celda(
  hijos: (Paragraph | Table)[],
  opciones: {
    ancho?: number;
    fondo?: string;
    bordes?: Partial<Record<"top" | "bottom" | "left" | "right", typeof BORDE_FINO>>;
    margen?: number;
    /** Contenido centrado en vertical dentro de la celda. */
    centrado?: boolean;
  } = {},
) {
  const margen = opciones.margen ?? 120;
  return new TableCell({
    width: opciones.ancho ? { size: opciones.ancho, type: WidthType.DXA } : undefined,
    shading: opciones.fondo ? { type: ShadingType.CLEAR, color: "auto", fill: opciones.fondo } : undefined,
    borders: { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, ...opciones.bordes },
    margins: { top: margen, bottom: margen, left: margen + 40, right: margen + 40 },
    verticalAlign: opciones.centrado ? "center" : undefined,
    children: hijos.length > 0 ? hijos : [new Paragraph({})],
  });
}

/** Tabla de ancho completo, con columnas fijas y filas que no se parten. */
function tabla(filas: TableCell[][], anchos: number[]) {
  return new Table({
    width: { size: ANCHO_UTIL_TWIPS, type: WidthType.DXA },
    columnWidths: anchos,
    layout: TableLayoutType.FIXED,
    borders: SIN_BORDES,
    rows: filas.map((celdas) => new TableRow({ cantSplit: true, children: celdas })),
  });
}

/** Reparte el ancho útil en `n` columnas iguales. */
function columnasIguales(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(ANCHO_UTIL_TWIPS / n));
}

/**
 * Rejilla de tarjetas con borde fino y un hueco blanco entre ellas (las
 * columnas de en medio hacen de separación).
 */
function rejillaDeTarjetas(tarjetas: Paragraph[][], columnas: number): Table {
  const hueco = 160;
  const anchoTarjeta = Math.floor((ANCHO_UTIL_TWIPS - hueco * (columnas - 1)) / columnas);
  const anchos: number[] = [];
  for (let indice = 0; indice < columnas; indice++) {
    anchos.push(anchoTarjeta);
    if (indice < columnas - 1) anchos.push(hueco);
  }

  const filas: TableCell[][] = [];
  enFilas(tarjetas, columnas).forEach((fila, indiceFila) => {
    // Una fila vacía y estrecha entre filas de tarjetas: el aire que en
    // el PDF da el margen.
    if (indiceFila > 0) filas.push(anchos.map((ancho) => celda([parrafo("", { espacioDespues: 0, tamano: 8 })], { ancho, margen: 0 })));
    const celdas: TableCell[] = [];
    for (let indice = 0; indice < columnas; indice++) {
      const contenido = fila[indice];
      celdas.push(
        celda(contenido ?? [], {
          ancho: anchoTarjeta,
          bordes: contenido ? { top: BORDE_FINO, bottom: BORDE_FINO, left: BORDE_FINO, right: BORDE_FINO } : undefined,
        }),
      );
      if (indice < columnas - 1) celdas.push(celda([], { ancho: hueco, margen: 0 }));
    }
    filas.push(celdas);
  });
  return tabla(filas, anchos);
}

/** Una cifra grande con su etiqueta debajo, para las rejillas de tarjetas. */
function tarjetaDeCifra(valor: string, etiqueta: string, detalle?: string): Paragraph[] {
  const hijos = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: valor, size: 32, bold: true, color: NAVY })],
    }),
    parrafo(etiqueta, { color: GRIS, tamano: 17, espacioDespues: detalle ? 40 : 0, interlineado: 260 }),
  ];
  if (detalle) hijos.push(parrafo(detalle, { color: GRIS_TENUE, tamano: 15, espacioDespues: 0, interlineado: 240 }));
  return hijos;
}

/** Recuadro de fondo suave con una raya de color a la izquierda. */
function recuadro(hijos: Paragraph[], fondo = FONDO_SUAVE) {
  return tabla(
    [[celda(hijos, { fondo, margen: 160, bordes: { left: { style: BorderStyle.SINGLE, size: 24, color: TEAL } } })]],
    [ANCHO_UTIL_TWIPS],
  );
}

function separacion(despues = 200) {
  return new Paragraph({ spacing: { after: despues }, children: [] });
}

function grupoDePatrocinadores(
  grupo: GrupoDePatrocinadores,
  logos: Map<string, ImagenDescargada | null>,
  textos: TextosDocumento,
): (Paragraph | Table)[] {
  const { t } = textos;
  const bloque: (Paragraph | Table)[] = [
    new Paragraph({
      keepNext: true,
      spacing: { before: 200, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDE, space: 2 } },
      children: [
        new TextRun({
          text: `${textos.nivelPatrocinador(grupo.etiqueta).toUpperCase()}  ·  ${grupo.patrocinadores.length}`,
          size: 16,
          bold: true,
          color: TEAL,
          characterSpacing: 20,
        }),
      ],
    }),
  ];

  if (grupo.conLogo) {
    bloque.push(
      rejillaDeTarjetas(
        grupo.patrocinadores.map((patrocinador) => {
          const logo = logos.get(patrocinador.id);
          const hijos: Paragraph[] = [];
          if (logo) {
            const { ancho, alto } = encajarEn(logo, 150, 60);
            hijos.push(imagen(logo, ancho, alto, AlignmentType.CENTER, 80));
          }
          hijos.push(parrafo(patrocinador.name, { negrita: true, tamano: 19, alineacion: AlignmentType.CENTER, espacioDespues: 20, interlineado: 260 }));
          if (patrocinador.sinceYear != null) {
            hijos.push(
              parrafo(t("desdeAnio", { anio: String(patrocinador.sinceYear) }), {
                color: GRIS_TENUE,
                tamano: 15,
                alineacion: AlignmentType.CENTER,
                espacioDespues: 0,
              }),
            );
          }
          return hijos;
        }),
        3,
      ),
    );
  } else {
    // Solo el nombre, en tres columnas: caben muchos y se leen de un
    // vistazo. Por orden alfabético, de izquierda a derecha.
    const anchos = columnasIguales(3);
    bloque.push(
      tabla(
        enFilas(grupo.patrocinadores, 3).map((fila) =>
          anchos.map((ancho, indice) =>
            celda(
              fila[indice]
                ? [
                    new Paragraph({
                      spacing: { after: 0 },
                      children: [
                        new TextRun({ text: "•  ", size: 19, color: TEAL, bold: true }),
                        new TextRun({ text: fila[indice].name, size: 19 }),
                      ],
                    }),
                  ]
                : [],
              { ancho, margen: 50 },
            ),
          ),
        ),
        anchos,
      ),
    );
  }
  return bloque;
}

/** Construye el .docx y lo devuelve como Buffer. */
export async function generarDossierWord(datos: DatosDossier, idioma?: string): Promise<Buffer> {
  const { perfil, equipos, patrocinadores, oportunidades, partidos, secciones, nivelesPatrocinadores, emailContacto } =
    datos;
  const textos = await textosDeDocumento(idioma, "dossier");
  const { t, E, tAlcance, numero: formatoNumero, precio: formatoValorOportunidad } = textos;

  // Solo los niveles de patrocinador que ha elegido el club.
  const gruposPatrocinadores = patrocinadoresDelDossier(patrocinadores, nivelesPatrocinadores ?? null, textos.intlLocale);
  const patrocinadoresElegidos = gruposPatrocinadores.flatMap((grupo) => grupo.patrocinadores);

  const disponibles = seccionesConContenido(perfil, equipos, patrocinadoresElegidos, partidos);
  const incluir = (clave: DossierSectionKey) => secciones.includes(clave) && disponibles.has(clave);

  const deportes = deportesDelClub(equipos).map(E.deporte);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const urlPublica = textos.urlDelClub(perfil.slug);
  const urlLimpia = urlPublica.replace(/^https?:\/\//, "");

  // Solo hacen falta los logos de los que salen con logo. Se traen todos
  // a la vez: son peticiones a Storage y en serie el club esperaría de
  // más mirando un botón girando.
  const conLogo = incluir("patrocinadores")
    ? gruposPatrocinadores.filter((grupo) => grupo.conLogo).flatMap((grupo) => grupo.patrocinadores)
    : [];
  const [portada, logo, logosPatrocinadores] = await Promise.all([
    descargarImagen(perfil.coverUrl),
    descargarImagen(perfil.logoUrl),
    Promise.all(conLogo.map((patrocinador) => descargarImagen(patrocinador.logoUrl))),
  ]);
  const logoPorId = new Map(conLogo.map((patrocinador, indice) => [patrocinador.id, logosPatrocinadores[indice]]));


  /**
   * El alcance, calculado en `lib/alcance.ts` — el mismo sitio que usan
   * el PDF y la página "Alcance" del panel. Que los tres salgan de una
   * sola cuenta no es elegancia: es que el día que una empresa compare
   * el Word con el PDF del mismo club, las cifras tienen que coincidir.
   */
  const alcance = calcularAlcance({ perfil, equipos, partidos }, tAlcance, textos.intlLocale);
  const cifrasPortada = cifrasDePortada(alcance);
  const frasesLlanas = resumenLlano(alcance, tAlcance, textos.intlLocale);
  const cifrasAudiencia = cifrasSencillasDeAudiencia(alcance);

  // "Redes sociales" sale con "Quiénes somos" o con "Audiencia", que son
  // de donde venían esos datos antes de tener apartado propio.
  const redes = redesDelClub(perfil);
  const verRedes =
    (secciones.includes("identidad") || secciones.includes("audiencia")) && (redes.length > 0 || !!perfil.website);

  const masBarata = oportunidades.reduce<number | null>(
    (minimo, oportunidad) => (minimo == null || oportunidad.value < minimo ? oportunidad.value : minimo),
    null,
  );

  const cuerpo: (Paragraph | Table)[] = [];

  // ---------- Portada: una página para ella sola ----------
  if (portada) {
    // `encajarEn` y no un alto recortado a pelo: al limitar el alto sin
    // tocar el ancho, una portada casi cuadrada salia aplastada.
    const medidas = encajarEn(portada, ANCHO_UTIL, 240);
    cuerpo.push(imagen(portada, medidas.ancho, medidas.alto, undefined, 240));
  }

  if (logo) {
    const { ancho, alto } = encajarEn(logo, 120, 120);
    cuerpo.push(imagen(logo, ancho, alto, undefined, 240));
  }

  cuerpo.push(antetitulo(t("portada")));
  cuerpo.push(
    new Paragraph({
      spacing: { before: 40, after: 120 },
      children: [new TextRun({ text: perfil.name, size: 52, bold: true, color: NAVY })],
    }),
  );

  if (deportes.length > 0 || ubicacion) {
    cuerpo.push(parrafo([deportes.join(" · "), ubicacion].filter(Boolean).join(" · "), { color: GRIS, tamano: 21, espacioDespues: 240 }));
  }

  if (perfil.description) {
    cuerpo.push(parrafo(recortar(perfil.description, 300), { espacioDespues: 320, interlineado: 320 }));
  }

  if (cifrasPortada.length > 0) {
    cuerpo.push(
      rejillaDeTarjetas(
        cifrasPortada.map((cifra) => tarjetaDeCifra(formatoNumero.format(cifra.valor), cifra.etiqueta)),
        4,
      ),
    );
    cuerpo.push(separacion(320));
  }

  if (masBarata != null) {
    cuerpo.push(
      recuadro(
        [
          parrafo(t("desde", { precio: formatoValorOportunidad.format(masBarata) }), {
            negrita: true,
            color: TEAL,
            tamano: 24,
            espacioDespues: 40,
          }),
          parrafo(t("detalleSiguiente", { n: oportunidades.length }), { color: GRIS, tamano: 18, espacioDespues: 0 }),
        ],
        TEAL_SUAVE,
      ),
    );
    cuerpo.push(separacion(400));
  }

  // Prueba social, solo si el club ha decidido enseñar sus patrocinadores.
  if (incluir("patrocinadores")) {
    const { nombres, resto } = nombresDePortada(gruposPatrocinadores);
    if (nombres.length > 0) {
      cuerpo.push(antetitulo(t("yaConfian")));
      cuerpo.push(
        parrafo(`${nombres.join("   ·   ")}${resto > 0 ? `   ·   ${t("yMas", { n: resto })}` : ""}`, {
          color: GRIS,
          tamano: 19,
          negrita: true,
          espacioDespues: 400,
        }),
      );
    }
  }

  // El pie de la portada: una franja azul marino con el logo de
  // ApoyaClub, que tiene las letras blancas y sobre el blanco de la
  // página no se vería (ver `dossier-marca.ts`). Igual que en el PDF.
  const anchoLogo = 200;
  const logoMarca = new Paragraph({
    children: [
      new ImageRun({
        type: "png",
        data: Buffer.from(logoDelDossier(textos.locale).split(",")[1], "base64"),
        transformation: { width: anchoLogo, height: Math.round((anchoLogo * ALTO_LOGO_DOSSIER) / ANCHO_LOGO_DOSSIER) },
      }),
    ],
  });
  const textosMarca = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: t("generado", { fecha: textos.fechaLarga(new Date()) }), size: 16, color: "CBD5E1" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 40 },
      children: [new TextRun({ text: urlLimpia, size: 17, bold: true, color: "5EEAD4" })],
    }),
  ];
  const anchoLogoTwips = 3400;
  cuerpo.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));
  cuerpo.push(
    tabla(
      [
        [
          celda([logoMarca], { ancho: anchoLogoTwips, fondo: NAVY, margen: 100 }),
          celda(textosMarca, { ancho: ANCHO_UTIL_TWIPS - anchoLogoTwips, fondo: NAVY, margen: 100, centrado: true }),
        ],
      ],
      [anchoLogoTwips, ANCHO_UTIL_TWIPS - anchoLogoTwips],
    ),
  );

  cuerpo.push(new Paragraph({ children: [new PageBreak()] }));

  // ---------- Contenido ----------
  // Los apartados, en el orden que ha elegido el club
  // (`lib/dossier-orden.ts`). Por defecto: primero quién es el club,
  // luego qué ofrece, a quién llega y quién confía ya en él. Cada uno
  // añade lo suyo a `cuerpo` si va (marcado y con datos). El contacto
  // cierra siempre, aquí debajo.
  const bloques: Record<BloqueDossier | "redes", () => void> = {
    identidad: () => {
      if (incluir("identidad") && perfil.description) {
        cuerpo.push(...cabecera(t("elClub"), t("quienesSomos")));
        cuerpo.push(parrafo(perfil.description, { interlineado: 320 }));
      }
    },
    historia: () => {
      if (incluir("historia")) {
        cuerpo.push(...cabecera(t("elClub"), t("historia")));
        if (perfil.foundingYear != null) cuerpo.push(parrafo(t("fundado", { anio: String(perfil.foundingYear) })));
        const hitos = perfil.milestones.slice().sort((a, b) => a.year - b.year);
        if (hitos.length > 0) {
          const anchoAno = 900;
          cuerpo.push(
            tabla(
              hitos.map((hito) => [
                celda([parrafo(String(hito.year), { negrita: true, color: TEAL, espacioDespues: 0 })], { ancho: anchoAno, margen: 60 }),
                celda([parrafo(hito.text, { color: GRIS, espacioDespues: 0 })], { ancho: ANCHO_UTIL_TWIPS - anchoAno, margen: 60 }),
              ]),
              [anchoAno, ANCHO_UTIL_TWIPS - anchoAno],
            ),
          );
        }
      }
    },
    instalaciones: () => {
      if (incluir("instalaciones") && (perfil.facilities || perfil.facilitiesAddress)) {
        cuerpo.push(...cabecera(t("elClub"), t("instalaciones")));
        if (perfil.facilitiesAddress) cuerpo.push(parrafo(perfil.facilitiesAddress, { negrita: true, espacioDespues: 80 }));
        if (perfil.facilities) cuerpo.push(parrafo(perfil.facilities, { color: GRIS, interlineado: 320 }));
      }

      // "Redes sociales": cada red con su dirección y sus seguidores juntos.
    },
    redes: () => {
      // "Redes sociales": cada red con su dirección y sus seguidores juntos.
      if (verRedes) {
        cuerpo.push(...cabecera(t("elClub"), t("redes"), t("redesTexto")));
        const tarjetas: Paragraph[][] = [];
        if (perfil.website) {
          tarjetas.push([
            parrafo(t("web"), { negrita: true, color: NAVY, tamano: 20, espacioDespues: 40 }),
            parrafo(limpiarDireccion(perfil.website), { color: TEAL, tamano: 16, espacioDespues: 0, interlineado: 240 }),
          ]);
        }
        for (const red of redes) {
          const hijos = [parrafo(red.nombre, { negrita: true, color: NAVY, tamano: 20, espacioDespues: 40 })];
          if (red.direccion) hijos.push(parrafo(red.direccion, { color: TEAL, tamano: 16, espacioDespues: red.seguidores != null ? 80 : 0, interlineado: 240 }));
          if (red.seguidores != null) {
            hijos.push(
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: formatoNumero.format(red.seguidores), size: 28, bold: true }),
                  new TextRun({ text: ` ${t("seguidores", { n: red.seguidores })}`, size: 16, color: GRIS }),
                ],
              }),
            );
          }
          tarjetas.push(hijos);
        }
        cuerpo.push(rejillaDeTarjetas(tarjetas, 3));
      }
    },
    oportunidades: () => {
      if (oportunidades.length > 0) {
        cuerpo.push(...cabecera(t("propuesta"), t("comoColaborar"), t("comoColaborarTexto")));

        // Una tarjeta por oportunidad: a la izquierda qué es, a la derecha
        // cuánto. Con una raya de color a la izquierda, como en el PDF.
        const anchoPrecio = 1900;
        const anchoTexto = ANCHO_UTIL_TWIPS - anchoPrecio;
        const filas: TableCell[][] = [];
        oportunidades.forEach((oportunidad, indice) => {
          if (indice > 0) filas.push([celda([parrafo("", { espacioDespues: 0, tamano: 8 })], { ancho: anchoTexto, margen: 0 }), celda([], { ancho: anchoPrecio, margen: 0 })]);

          const detalles = [
            oportunidad.duration,
            oportunidad.exclusivity ? t("exclusiva", { sector: oportunidad.exclusivity }) : null,
          ].filter((linea): linea is string => !!linea);

          const izquierda: Paragraph[] = [
            parrafo(oportunidad.title, { negrita: true, tamano: 22, espacioDespues: oportunidad.description || detalles.length ? 80 : 0, interlineado: 270 }),
          ];
          if (oportunidad.description) {
            izquierda.push(parrafo(oportunidad.description, { color: GRIS, tamano: 19, espacioDespues: detalles.length ? 80 : 0 }));
          }
          if (detalles.length > 0) izquierda.push(parrafo(detalles.join("   ·   "), { color: TEAL, tamano: 16, negrita: true, espacioDespues: 0 }));

          const bordes = { top: BORDE_FINO, bottom: BORDE_FINO };
          filas.push([
            celda(izquierda, {
              ancho: anchoTexto,
              margen: 160,
              bordes: { ...bordes, left: { style: BorderStyle.SINGLE, size: 24, color: TEAL } },
            }),
            celda(
              [
                parrafo(formatoValorOportunidad.format(oportunidad.value), {
                  negrita: true,
                  color: TEAL,
                  tamano: 26,
                  alineacion: AlignmentType.RIGHT,
                  espacioDespues: 0,
                }),
              ],
              { ancho: anchoPrecio, margen: 160, bordes: { ...bordes, right: BORDE_FINO } },
            ),
          ]);
        });
        cuerpo.push(tabla(filas, [anchoTexto, anchoPrecio]));
      }
    },
    equipos: () => {
      if (incluir("equipos")) {
        cuerpo.push(...cabecera(t("aQuienLlegas"), t("equipos")));
        cuerpo.push(
          rejillaDeTarjetas(
            equipos.map((equipo) => {
              const hijos = [
                parrafo(`${E.deporte(equipo.sport)}${equipo.category ? ` · ${equipo.category}` : ""}`, {
                  negrita: true,
                  tamano: 20,
                  espacioDespues: 40,
                  interlineado: 260,
                }),
                parrafo(
                  [E.nivelEquipo(equipo.teamLevel), equipo.gender ? textos.sexo(equipo.gender) : null].filter(Boolean).join(" · "),
                  { color: GRIS, tamano: 17, espacioDespues: 0 },
                ),
              ];
              if (equipo.playerCount != null) {
                hijos.push(parrafo(t("jugadores", { n: equipo.playerCount }), { color: GRIS, tamano: 17, espacioDespues: 0 }));
              }
              return hijos;
            }),
            3,
          ),
        );
      }
    },
    cantera: () => {
      if (incluir("cantera")) {
        const cifras = [
          perfil.youthTeamsCount != null ? tarjetaDeCifra(formatoNumero.format(perfil.youthTeamsCount), t("tarjetaEquipos")) : null,
          perfil.youthPlayersCount != null ? tarjetaDeCifra(formatoNumero.format(perfil.youthPlayersCount), t("tarjetaJugadores")) : null,
          perfil.youthFamiliesCount != null ? tarjetaDeCifra(formatoNumero.format(perfil.youthFamiliesCount), t("tarjetaFamilias")) : null,
        ].filter((cifra): cifra is Paragraph[] => cifra !== null);

        if (cifras.length > 0) {
          cuerpo.push(...cabecera(t("aQuienLlegas"), t("cantera"), t("canteraTexto")));
          cuerpo.push(rejillaDeTarjetas(cifras, 3));
        }
      }
    },
    audiencia: () => {
      if (incluir("audiencia") && alcance.hayCifras && (frasesLlanas.length > 0 || cifrasAudiencia.length > 0)) {
        cuerpo.push(...cabecera(t("aQuienLlegas"), t("audiencia"), t("audienciaTexto")));

        // Primero en cristiano, y debajo las cifras una a una, cada una con
        // una etiqueta corta de dónde sale: lo mismo que el PDF.
        if (frasesLlanas.length > 0) {
          cuerpo.push(recuadro(frasesLlanas.map((frase, indice) => parrafo(frase, { tamano: 21, espacioDespues: indice < frasesLlanas.length - 1 ? 60 : 0 }))));
          cuerpo.push(separacion(160));
        }

        if (cifrasAudiencia.length > 0) {
          cuerpo.push(
            rejillaDeTarjetas(
              cifrasAudiencia.map((cifra) =>
                tarjetaDeCifra(
                  `${formatoNumero.format(cifra.valor)} ${unidadEnTexto(cifra.unidad, cifra.valor, tAlcance)}`,
                  cifra.etiqueta,
                  cifra.origen === "contado" ? t("origenContado") : t("origenDeclarado"),
                ),
              ),
              3,
            ),
          );
        }

        cuerpo.push(parrafo(tAlcance("avisoDeOrigen"), { color: GRIS_TENUE, tamano: 16, espacioAntes: 160 }));
      }
    },
    patrocinadores: () => {
      if (incluir("patrocinadores")) {
        cuerpo.push(...cabecera(t("confian"), t("patrocinadores"), t("patrocinadoresTexto")));
        for (const grupo of gruposPatrocinadores) cuerpo.push(...grupoDePatrocinadores(grupo, logoPorId, textos));
      }
    },
  };

  // "Redes sociales" no es una sección con casilla: va pegada a
  // "Identidad" y, si esa no va, a "Audiencia". Igual que en el PDF.
  const bloqueDeLasRedes: BloqueDossier = secciones.includes("identidad") ? "identidad" : "audiencia";
  for (const bloque of datos.orden ?? ORDEN_POR_DEFECTO) {
    bloques[bloque]();
    if (bloque === bloqueDeLasRedes) bloques.redes();
  }

  // El contacto, destacado en un recuadro azul: es a lo que tiene que
  // llevar todo lo anterior.
  if (emailContacto || (perfil.contactPublicConsent && perfil.contactPhone)) {
    const lineas: Paragraph[] = [
      parrafo(t("hablemos").toUpperCase(), { color: "7FCFC3", tamano: 16, negrita: true, espacioDespues: 60 }),
      parrafo(t("teInteresa"), { color: BLANCO, tamano: 28, negrita: true, espacioDespues: 160 }),
    ];
    if (perfil.contactPublicConsent && perfil.contactName) lineas.push(parrafo(perfil.contactName, { color: BLANCO, tamano: 22, negrita: true, espacioDespues: 60 }));
    if (emailContacto) lineas.push(parrafo(emailContacto, { color: BLANCO, tamano: 22, espacioDespues: 60 }));
    if (perfil.contactPublicConsent && perfil.contactPhone) lineas.push(parrafo(perfil.contactPhone, { color: BLANCO, tamano: 22, espacioDespues: 60 }));
    if (perfil.contactHours) lineas.push(parrafo(perfil.contactHours, { color: "C7D3E0", tamano: 18, espacioDespues: 60 }));
    lineas.push(parrafo(urlLimpia, { color: "C7D3E0", tamano: 18, espacioDespues: 0 }));

    cuerpo.push(separacion(360));
    cuerpo.push(tabla([[celda(lineas, { fondo: NAVY, margen: 280 })]], [ANCHO_UTIL_TWIPS]));
  }

  const documento = new Document({
    creator: perfil.name,
    title: t("tituloDocumento", { club: perfil.name }),
    description: t("asunto"),
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21, color: "18181B" } },
        heading1: {
          run: { font: "Calibri", size: 32, bold: true, color: NAVY },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        heading2: {
          run: { font: "Calibri", size: 24, bold: true, color: NAVY },
          paragraph: { spacing: { before: 180, after: 80 } },
        },
      },
      paragraphStyles: [
        {
          id: "PieDossier",
          name: "Pie del dossier",
          basedOn: "Normal",
          run: { font: "Calibri", size: 16, color: GRIS_TENUE },
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                style: "PieDossier",
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${urlLimpia}  ·  ApoyaClub  ·  ${t("paginaPalabra")} `, size: 16, color: GRIS_TENUE }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRIS_TENUE }),
                  new TextRun({ text: ` ${t("de")} `, size: 16, color: GRIS_TENUE }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRIS_TENUE }),
                ],
              }),
            ],
          }),
        },
        children: cuerpo,
      },
    ],
  });

  return Packer.toBuffer(documento);
}
