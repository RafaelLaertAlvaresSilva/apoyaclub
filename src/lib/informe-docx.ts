import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { fraseDeResumen, type ResumenInforme } from "@/lib/informe-patrocinio";
import { descargarImagen, encajarEn } from "@/lib/imagenes-remotas";
import { textosDeDocumento, type TextosDocumento } from "@/lib/textos-documento";
import { fechaLegible, type TareaPatrocinio } from "@/lib/tareas-patrocinio";
import type { ClubProfile } from "@/lib/types";

/**
 * El mismo informe de patrocinio, en Word.
 *
 * Igual que con el dossier: el PDF es lo que se manda, el Word es para
 * que el club le añada una foto del equipo con el logo de la empresa,
 * cambie el agradecimiento por algo suyo, o quite una línea. La
 * diferencia entre un informe que parece un albarán y uno que parece
 * una carta suele estar en esos dos retoques.
 */

const NAVY = "14304F";
const TEAL = "0F766E";
const GRIS = "52525B";
const GRIS_TENUE = "A1A1AA";
const ROJO = "B91C1C";

export type DatosInformeWord = {
  perfil: ClubProfile;
  informe: ResumenInforme;
  emailContacto: string | null;
};

function parrafo(
  texto: string,
  opciones: { color?: string; tamano?: number; negrita?: boolean; espacioDespues?: number } = {},
) {
  return new Paragraph({
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

/** Una acción de la lista: qué, cuándo y, si la hay, la prueba. */
function lineaDeTarea(
  tarea: TareaPatrocinio,
  marca: string,
  color: string,
  textos: TextosDocumento,
): Paragraph[] {
  const { t, intlLocale } = textos;
  const detalle = [
    tarea.inicio
      ? t("periodo", { desde: fechaLegible(tarea.inicio, intlLocale), hasta: fechaLegible(tarea.fin, intlLocale) })
      : fechaLegible(tarea.fin, intlLocale),
    tarea.notas ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  const parrafos = [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `${marca}  `, size: 22, bold: true, color }),
        new TextRun({ text: tarea.accion, size: 22, bold: true }),
      ],
    }),
    new Paragraph({
      indent: { left: 340 },
      spacing: { after: tarea.pruebaUrl ? 40 : 140 },
      children: [new TextRun({ text: detalle, size: 18, color: GRIS })],
    }),
  ];

  if (tarea.pruebaUrl) {
    parrafos.push(
      new Paragraph({
        indent: { left: 340 },
        spacing: { after: 140 },
        children: [
          new TextRun({ text: tarea.pruebaUrl.replace(/^https?:\/\//, ""), size: 18, color: TEAL }),
        ],
      }),
    );
  }

  return parrafos;
}

export async function generarInformeWord(datos: DatosInformeWord, idioma?: string): Promise<Buffer> {
  const { perfil, informe, emailContacto } = datos;
  const textos = await textosDeDocumento(idioma, "informe");
  const { t, intlLocale } = textos;

  const logo = await descargarImagen(perfil.logoUrl);
  const urlLimpia = textos.urlDelClub(perfil.slug).replace(/^https?:\/\//, "");

  const periodo =
    informe.desde && informe.hasta
      ? informe.desde === informe.hasta
        ? fechaLegible(informe.desde, intlLocale)
        : t("periodo", { desde: fechaLegible(informe.desde, intlLocale), hasta: fechaLegible(informe.hasta, intlLocale) })
      : null;

  const cuerpo: Paragraph[] = [];

  if (logo) {
    const { ancho, alto } = encajarEn(logo, 110, 110);
    cuerpo.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new ImageRun({ type: logo.tipo, data: logo.data, transformation: { width: ancho, height: alto } })],
      }),
    );
  }

  cuerpo.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: t("portada").toUpperCase(), size: 16, bold: true, color: TEAL, characterSpacing: 20 }),
      ],
    }),
  );
  cuerpo.push(parrafo(perfil.name, { negrita: true, tamano: 24, color: NAVY, espacioDespues: 240 }));

  cuerpo.push(parrafo(t("loHecho"), { color: GRIS, tamano: 18, espacioDespues: 40 }));
  cuerpo.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: informe.empresa, size: 44, bold: true, color: NAVY })],
    }),
  );
  if (periodo) cuerpo.push(parrafo(periodo, { color: GRIS, tamano: 20 }));

  cuerpo.push(parrafo(fraseDeResumen(informe, t), { tamano: 24, espacioDespues: 200 }));

  cuerpo.push(
    parrafo(
      t("resumenLinea", { total: informe.total, cumplidas: informe.cumplidas.length, prueba: informe.conPrueba }),
      { color: GRIS, tamano: 20, espacioDespues: 200 },
    ),
  );

  if (informe.cumplidas.length > 0) {
    cuerpo.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: t("hecho") }));
    for (const tarea of informe.cumplidas) cuerpo.push(...lineaDeTarea(tarea, "✓", TEAL, textos));
  }

  if (informe.enMarcha.length > 0) {
    cuerpo.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: t("enMarcha") }));
    for (const tarea of informe.enMarcha) cuerpo.push(...lineaDeTarea(tarea, "•", GRIS_TENUE, textos));
  }

  if (informe.vencidas.length > 0) {
    cuerpo.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: t("vencidas") }));
    for (const tarea of informe.vencidas) cuerpo.push(...lineaDeTarea(tarea, "!", ROJO, textos));
  }

  cuerpo.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: t("gracias") }));
  cuerpo.push(
    parrafo(
      t("graciasTexto"),
      { color: GRIS },
    ),
  );
  if (perfil.contactPublicConsent && perfil.contactName) {
    cuerpo.push(parrafo(perfil.contactName, { negrita: true, espacioDespues: 40 }));
  }
  if (emailContacto) cuerpo.push(parrafo(emailContacto, { espacioDespues: 40 }));
  if (perfil.contactPublicConsent && perfil.contactPhone) {
    cuerpo.push(parrafo(perfil.contactPhone, { espacioDespues: 40 }));
  }

  const documento = new Document({
    creator: perfil.name,
    title: t("tituloDocumento", { empresa: informe.empresa }),
    description: t("asunto", { empresa: informe.empresa }),
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "18181B" } },
        heading1: {
          run: { font: "Calibri", size: 26, bold: true, color: NAVY },
          paragraph: { spacing: { before: 280, after: 140 } },
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
