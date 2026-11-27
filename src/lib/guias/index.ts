import type { Bloque, CategoriaDeGuia, Guia } from "./tipos";
import { comoConseguirPatrocinadores } from "@/content/guias/como-conseguir-patrocinadores";
import { GUIAS_DE_DEPORTE } from "@/content/guias/deportes";

export type { Bloque, CategoriaDeGuia, Guia } from "./tipos";

/** Las guías publicadas, de la más nueva a la más antigua. Una guía
 * nueva se añade aquí arriba. */
export const GUIAS: Guia[] = [comoConseguirPatrocinadores, ...GUIAS_DE_DEPORTE];

/** Las guías solo están en español por ahora (los clubes y empresas que
 * llegan hoy son de España). Cuando haya traducción, se añade aquí. */
export const IDIOMAS_DE_GUIAS = ["es"] as const;

export function hayGuiasEn(idioma: string): boolean {
  return (IDIOMAS_DE_GUIAS as readonly string[]).includes(idioma);
}

export const NOMBRE_CATEGORIA: Record<CategoriaDeGuia, string> = {
  clubes: "Para clubes",
  empresas: "Para empresas",
  ideas: "Ideas de patrocinio",
};

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

export function guiasRelacionadas(guia: Guia): Guia[] {
  const elegidas = guia.relacionadas
    .map(guiaPorSlug)
    .filter((g): g is Guia => g !== undefined && g.slug !== guia.slug);
  // Si aún no hay bastantes, se completa con las más recientes.
  for (const otra of GUIAS) {
    if (elegidas.length >= 3) break;
    if (otra.slug !== guia.slug && !elegidas.includes(otra)) elegidas.push(otra);
  }
  return elegidas.slice(0, 3);
}

/** Los apartados de la guía, para el índice. */
export function indiceDe(guia: Guia): { id: string; titulo: string }[] {
  return guia.cuerpo
    .filter((b): b is Extract<Bloque, { tipo: "apartado" }> => b.tipo === "apartado")
    .map((b) => ({ id: b.id, titulo: b.titulo }));
}

/** El texto sin marcas: para contar palabras y para la descripción. */
export function textoPlano(texto: string): string {
  return texto.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}

function textosDe(bloque: Bloque): string[] {
  switch (bloque.tipo) {
    case "parrafo":
      return [bloque.texto];
    case "apartado":
    case "subtitulo":
      return [bloque.titulo];
    case "lista":
      return bloque.elementos;
    case "tarjetas":
      return bloque.elementos.flatMap((e) => [e.titulo, e.texto]);
    case "tabla":
      return bloque.filas.flat();
    case "consejo":
    case "error":
    case "llamada":
      return [bloque.titulo, bloque.texto];
    case "ejemplo":
      return [bloque.titulo, ...bloque.lineas];
    case "checklist":
      return [bloque.titulo, ...bloque.elementos];
  }
}

export function palabrasDe(guia: Guia): number {
  const textos = [
    guia.titulo,
    guia.entradilla,
    ...guia.resumen,
    ...guia.cuerpo.flatMap(textosDe),
    ...guia.preguntas.flatMap((p) => [p.pregunta, p.respuesta]),
  ];
  return textos.map(textoPlano).join(" ").split(/\s+/).filter(Boolean).length;
}

/** Minutos de lectura, a 220 palabras por minuto. */
export function minutosDeLectura(guia: Guia): number {
  return Math.max(1, Math.round(palabrasDe(guia) / 220));
}

/** "24 de noviembre de 2026". */
export function fechaLarga(fecha: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}

/** Un texto de guía partido en sus marcas: **negrita** y [enlace](href). */
export type Trozo =
  | { tipo: "texto"; texto: string }
  | { tipo: "negrita"; texto: string }
  | { tipo: "enlace"; texto: string; href: string };

const MARCAS = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

export function trozosDe(texto: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;
  for (const m of texto.matchAll(MARCAS)) {
    const inicio = m.index ?? 0;
    if (inicio > desde) trozos.push({ tipo: "texto", texto: texto.slice(desde, inicio) });
    if (m[1] !== undefined) trozos.push({ tipo: "negrita", texto: m[1] });
    else trozos.push({ tipo: "enlace", texto: m[2], href: m[3] });
    desde = inicio + m[0].length;
  }
  if (desde < texto.length) trozos.push({ tipo: "texto", texto: texto.slice(desde) });
  return trozos;
}
