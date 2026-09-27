/**
 * Las ocho secciones de la ficha del club.
 *
 * En su propio archivo, y no dentro de `PanelTabs`, porque el menú del
 * panel también las necesita. Importándolas de allí, el menú —que está
 * en todas las páginas del panel— se llevaba por delante los ocho
 * formularios al navegador, incluso en páginas donde no hay ficha que
 * rellenar.
 */
export type Pestana =
  | "identidad"
  | "nivel"
  | "equipos"
  | "instalaciones"
  | "cantera"
  | "historia"
  | "audiencia"
  | "comunidad";

export const SECCIONES_DE_LA_FICHA: { id: Pestana; etiqueta: string }[] = [
  { id: "identidad", etiqueta: "Identidad" },
  { id: "nivel", etiqueta: "Nivel deportivo" },
  { id: "equipos", etiqueta: "Equipos" },
  { id: "instalaciones", etiqueta: "Instalaciones" },
  { id: "cantera", etiqueta: "Cantera" },
  { id: "historia", etiqueta: "Historia" },
  { id: "audiencia", etiqueta: "Audiencia" },
  { id: "comunidad", etiqueta: "Acción social" },
];

export const IDS_PESTANA = new Set<string>(SECCIONES_DE_LA_FICHA.map((seccion) => seccion.id));
