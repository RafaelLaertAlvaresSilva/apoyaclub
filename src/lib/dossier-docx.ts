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
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { agruparPatrocinadoresPorNivel } from "@/lib/club-mappers";
import { deportesDelClub, seccionesConContenido } from "@/lib/dossier";
import type { DatosDossier } from "@/lib/dossier-datos";
import {
  altoProporcional,
  descargarImagen,
  encajarEn,
  type ImagenDescargada,
} from "@/lib/imagenes-remotas";
import { formatoValorOportunidad } from "@/lib/opportunities";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import type { ClubTeam, DossierSectionKey, SocialLinks } from "@/lib/types";

/**
 * El mismo dossier que el PDF, pero en Word (.docx).
 *
 * El PDF es lo que se manda a una empresa: cerrado, con la maqueta
 * intacta, igual en cualquier pantalla. El Word es para el club: para
 * cambiarle una frase, meter la foto del equipo de este año o mover la
 * página de patrocinadores antes que la de instalaciones sin tener que
 * pedírselo a nadie.
 *
 * Por eso este documento NO intenta imitar la maqueta del PDF. Un Word
 * lleno de cajas y columnas se descoloca en cuanto se toca una línea, y
 * el club acaba peleándose con el archivo. Va montado como un documento
 * de Word de verdad:
 *
 *   - Cada apartado es un Título 1 real, así que sale en el panel de
 *     navegación de Word y se puede arrastrar entero a otro sitio.
 *   - El texto va en párrafos normales, no dentro de tablas, para que
 *     fluya al editarlo.
 *   - Las imágenes van empotradas y con su proporción respetada: se
 *     pueden seleccionar, mover y sustituir como cualquier otra.
 */

const NAVY = "14304F";
const TEAL = "0F766E";
const GRIS = "52525B";
const GRIS_TENUE = "A1A1AA";

const ANCHO_UTIL = 690; // ancho util de una A4 con los margenes de este documento (0,5")

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
const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function recortar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const cortado = texto.slice(0, limite);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : limite).trimEnd()}…`;
}

function parrafo(texto: string, opciones: { color?: string; tamano?: number; negrita?: boolean; espacioDespues?: number; alineacion?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: opciones.alineacion,
    spacing: { after: opciones.espacioDespues ?? 120 },
    children: [
      new TextRun({
        text: texto,
        size: opciones.tamano ?? 22,
        bold: opciones.negrita,
        color: opciones.color ?? "18181B",
      }),
    ],
  });
}

function antetitulo(texto: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: texto.toUpperCase(), size: 16, bold: true, color: TEAL, characterSpacing: 20 }),
    ],
  });
}

function titulo(texto: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, text: texto });
}

function imagen(img: ImagenDescargada, ancho: number, alto: number, alineacion?: (typeof AlignmentType)[keyof typeof AlignmentType]) {
  return new Paragraph({
    alignment: alineacion,
    spacing: { after: 160 },
    children: [new ImageRun({ type: img.tipo, data: img.data, transformation: { width: ancho, height: alto } })],
  });
}

/** Fila de cifras. Una tabla sin bordes: en Word se edita bien y no se descoloca. */
function tablaDeCifras(cifras: { etiqueta: string; valor: string }[]) {
  const sinBorde = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: sinBorde,
      bottom: sinBorde,
      left: sinBorde,
      right: sinBorde,
      insideHorizontal: sinBorde,
      insideVertical: sinBorde,
    },
    rows: [
      new TableRow({
        children: cifras.map(
          (cifra) =>
            new TableCell({
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [new TextRun({ text: cifra.valor, size: 32, bold: true, color: NAVY })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: cifra.etiqueta, size: 16, color: GRIS })],
                }),
              ],
            }),
        ),
      }),
    ],
  });
}

/** Construye el .docx y lo devuelve como Buffer. */
export async function generarDossierWord(datos: DatosDossier): Promise<Buffer> {
  const { perfil, equipos, patrocinadores, oportunidades, secciones, emailContacto } = datos;

  const disponibles = seccionesConContenido(perfil, equipos, patrocinadores);
  const incluir = (clave: DossierSectionKey) => secciones.includes(clave) && disponibles.has(clave);

  const deportes = deportesDelClub(equipos);
  const ubicacion = [perfil.city, perfil.province].filter(Boolean).join(", ");
  const urlPublica = `${SITE_URL}/${routing.defaultLocale}/club/${perfil.slug}`;
  const urlLimpia = urlPublica.replace(/^https?:\/\//, "");

  // Las imágenes se traen todas a la vez: son peticiones a Storage y en
  // serie el club esperaría de más mirando un botón girando.
  const [portada, logo, logosPatrocinadores] = await Promise.all([
    descargarImagen(perfil.coverUrl),
    descargarImagen(perfil.logoUrl),
    Promise.all(patrocinadores.map((patrocinador) => descargarImagen(patrocinador.logoUrl))),
  ]);

  const redesSociales = (Object.entries(perfil.socialLinks) as [keyof SocialLinks, string | undefined][])
    .filter((entrada): entrada is [keyof SocialLinks, string] => !!entrada[1]);

  const seguidoresTotales = Object.values(perfil.followersByNetwork).reduce<number>(
    (suma, valor) => suma + (valor ?? 0),
    0,
  );

  const jugadoresEnEquipos = equipos.reduce<number>((suma, equipo) => suma + (equipo.playerCount ?? 0), 0);
  const jugadores = jugadoresEnEquipos > 0 ? jugadoresEnEquipos : perfil.youthPlayersCount;

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

  const cuerpo: (Paragraph | Table)[] = [];

  // ---------- Portada ----------
  if (portada) {
    cuerpo.push(imagen(portada, ANCHO_UTIL, Math.min(altoProporcional(portada, ANCHO_UTIL), 260)));
  }

  if (logo) {
    const { ancho, alto } = encajarEn(logo, 150, 150);
    cuerpo.push(imagen(logo, ancho, alto));
  }

  cuerpo.push(antetitulo("Dossier de patrocinio"));
  cuerpo.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: perfil.name, size: 56, bold: true, color: NAVY })],
    }),
  );

  if (deportes.length > 0 || ubicacion) {
    cuerpo.push(parrafo([deportes.join(" · "), ubicacion].filter(Boolean).join(" · "), { color: GRIS, tamano: 20 }));
  }

  if (perfil.description) {
    cuerpo.push(parrafo(recortar(perfil.description, 320), { color: GRIS, espacioDespues: 200 }));
  }

  if (cifrasPortada.length > 0) {
    cuerpo.push(tablaDeCifras(cifrasPortada));
    cuerpo.push(parrafo("", { espacioDespues: 120 }));
  }

  if (masBarata != null) {
    cuerpo.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `Puedes colaborar con nosotros desde ${formatoValorOportunidad.format(masBarata)}`,
            size: 24,
            bold: true,
            color: TEAL,
          }),
        ],
      }),
    );
    cuerpo.push(
      parrafo(
        oportunidades.length === 1
          ? "Tienes el detalle en la página siguiente."
          : `${oportunidades.length} formas distintas de colaborar, en la página siguiente.`,
        { color: GRIS, tamano: 18 },
      ),
    );
  }

  if (patrocinadores.length > 0) {
    cuerpo.push(antetitulo("Ya confían en nosotros"));
    cuerpo.push(
      parrafo(
        patrocinadores
          .slice(0, 8)
          .map((patrocinador) => patrocinador.name)
          .join("  ·  "),
        { color: GRIS, tamano: 20 },
      ),
    );
  }

  cuerpo.push(
    parrafo(`ApoyaClub · Dossier generado el ${formatoFecha.format(new Date())} · ${urlLimpia}`, {
      color: GRIS_TENUE,
      tamano: 16,
    }),
  );

  cuerpo.push(new Paragraph({ children: [new PageBreak()] }));

  // ---------- Contenido ----------
  if (incluir("identidad") && perfil.description) {
    cuerpo.push(titulo("Quiénes somos"));
    cuerpo.push(parrafo(perfil.description));
    if (perfil.website || redesSociales.length > 0) {
      cuerpo.push(
        parrafo(
          [perfil.website, ...redesSociales.map(([, url]) => url)]
            .filter((url): url is string => !!url)
            .map((url) => url.replace(/^https?:\/\//, ""))
            .join("  ·  "),
          { color: GRIS, tamano: 20 },
        ),
      );
    }
  }

  if (oportunidades.length > 0) {
    cuerpo.push(titulo("Cómo puedes colaborar"));
    cuerpo.push(parrafo("Formas concretas de patrocinar al club, con su valor.", { color: GRIS, tamano: 20 }));

    for (const oportunidad of oportunidades) {
      cuerpo.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 40 },
          text: `${oportunidad.title} — ${formatoValorOportunidad.format(oportunidad.value)}`,
        }),
      );
      if (oportunidad.description) cuerpo.push(parrafo(oportunidad.description, { espacioDespues: 60 }));
      if (oportunidad.exclusivity) {
        cuerpo.push(parrafo(`Exclusiva para el sector ${oportunidad.exclusivity}`, { color: TEAL, tamano: 18, negrita: true, espacioDespues: 40 }));
      }
      if (oportunidad.duration) cuerpo.push(parrafo(oportunidad.duration, { color: GRIS, tamano: 18 }));
    }
  }

  if (incluir("equipos")) {
    cuerpo.push(titulo("Equipos"));
    for (const equipo of equipos) {
      const detalle = [
        ETIQUETA_NIVEL_EQUIPO[equipo.teamLevel],
        equipo.gender ?? null,
        equipo.playerCount != null ? `${formatoNumero.format(equipo.playerCount)} jugadores` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      cuerpo.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${equipo.sport}${equipo.category ? ` · ${equipo.category}` : ""}`, size: 22, bold: true }),
            new TextRun({ text: detalle ? ` — ${detalle}` : "", size: 22, color: GRIS }),
          ],
        }),
      );
    }
  }

  if (incluir("cantera")) {
    const cifras = [
      perfil.youthTeamsCount != null
        ? { etiqueta: "Equipos", valor: formatoNumero.format(perfil.youthTeamsCount) }
        : null,
      perfil.youthPlayersCount != null
        ? { etiqueta: "Jugadores", valor: formatoNumero.format(perfil.youthPlayersCount) }
        : null,
      perfil.youthFamiliesCount != null
        ? { etiqueta: "Familias", valor: formatoNumero.format(perfil.youthFamiliesCount) }
        : null,
    ].filter((cifra): cifra is { etiqueta: string; valor: string } => cifra !== null);

    if (cifras.length > 0) {
      cuerpo.push(titulo("Cantera"));
      cuerpo.push(parrafo("Datos agregados de las categorías inferiores del club.", { color: GRIS, tamano: 20 }));
      cuerpo.push(tablaDeCifras(cifras));
    }
  }

  if (incluir("audiencia") && estadisticasAudiencia.length > 0) {
    cuerpo.push(titulo("Audiencia en cifras"));
    for (const estadistica of estadisticasAudiencia) {
      cuerpo.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${estadistica.etiqueta}: `, size: 22, color: GRIS }),
            new TextRun({ text: estadistica.valor, size: 22, bold: true, color: NAVY }),
          ],
        }),
      );
    }
  }

  if (incluir("patrocinadores")) {
    cuerpo.push(titulo("Patrocinadores actuales"));
    cuerpo.push(parrafo("Empresas que ya colaboran con el club.", { color: GRIS, tamano: 20 }));

    const logoPorId = new Map(
      patrocinadores.map((patrocinador, indice) => [patrocinador.id, logosPatrocinadores[indice]]),
    );

    for (const grupo of agruparPatrocinadoresPorNivel(patrocinadores)) {
      cuerpo.push(antetitulo(grupo.etiqueta));
      for (const patrocinador of grupo.patrocinadores) {
        const logoPatrocinador = logoPorId.get(patrocinador.id);
        if (logoPatrocinador) {
          const { ancho, alto } = encajarEn(logoPatrocinador, 90, 50);
          cuerpo.push(imagen(logoPatrocinador, ancho, alto));
        }
        cuerpo.push(
          parrafo(`${patrocinador.name}${patrocinador.sinceYear ? ` (desde ${patrocinador.sinceYear})` : ""}`, {
            negrita: true,
            espacioDespues: patrocinador.description ? 40 : 120,
          }),
        );
        if (patrocinador.description) cuerpo.push(parrafo(patrocinador.description, { color: GRIS, tamano: 20 }));
      }
    }
  }

  if (incluir("historia")) {
    cuerpo.push(titulo("Nuestra historia"));
    if (perfil.foundingYear != null) cuerpo.push(parrafo(`Fundado en ${perfil.foundingYear}.`));
    for (const hito of perfil.milestones.slice().sort((a, b) => a.year - b.year)) {
      cuerpo.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${hito.year}  `, size: 22, bold: true, color: TEAL }),
            new TextRun({ text: hito.text, size: 22 }),
          ],
        }),
      );
    }
  }

  if (incluir("instalaciones") && (perfil.facilities || perfil.facilitiesAddress)) {
    cuerpo.push(titulo("Instalaciones"));
    if (perfil.facilitiesAddress) cuerpo.push(parrafo(perfil.facilitiesAddress, { negrita: true, espacioDespues: 60 }));
    if (perfil.facilities) cuerpo.push(parrafo(perfil.facilities));
  }

  if (emailContacto || (perfil.contactPublicConsent && perfil.contactPhone)) {
    cuerpo.push(titulo("¿Te interesa colaborar con nosotros?"));
    if (perfil.contactPublicConsent && perfil.contactName) cuerpo.push(parrafo(perfil.contactName, { negrita: true, espacioDespues: 40 }));
    if (emailContacto) cuerpo.push(parrafo(emailContacto, { espacioDespues: 40 }));
    if (perfil.contactPublicConsent && perfil.contactPhone) cuerpo.push(parrafo(perfil.contactPhone, { espacioDespues: 40 }));
    if (perfil.contactHours) cuerpo.push(parrafo(perfil.contactHours, { color: GRIS, tamano: 20, espacioDespues: 40 }));
    cuerpo.push(parrafo(urlLimpia, { color: GRIS, tamano: 20 }));
  }

  const documento = new Document({
    creator: perfil.name,
    title: `Dossier de patrocinio — ${perfil.name}`,
    description: "Dossier comercial de patrocinio deportivo",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "18181B" } },
        heading1: {
          run: { font: "Calibri", size: 30, bold: true, color: NAVY },
          paragraph: { spacing: { before: 280, after: 140 } },
        },
        heading2: {
          run: { font: "Calibri", size: 24, bold: true, color: NAVY },
          paragraph: { spacing: { before: 180, after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${urlLimpia}  ·  ApoyaClub  ·  página `, size: 16, color: GRIS_TENUE }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRIS_TENUE }),
                  new TextRun({ text: " de ", size: 16, color: GRIS_TENUE }),
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
