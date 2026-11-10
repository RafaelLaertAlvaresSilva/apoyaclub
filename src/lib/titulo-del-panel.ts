import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * El título de la pestaña de cada página del panel (pedido por Rafael
 * el 10-11-2026): antes todas se llamaban "ApoyaClub — Conecta tu club
 * deportivo…", y con varias abiertas no había forma de distinguirlas.
 * Sale "Oportunidades | ApoyaClub" con el mismo nombre que el menú y
 * en el idioma del panel. El inicio se llama "Panel del club".
 */
export type PaginaDelPanel =
  | "inicio"
  | "perfil"
  | "publico"
  | "alcance"
  | "oportunidades"
  | "objetivos"
  | "solicitudes"
  | "dossier"
  | "patrocinadores"
  | "renovaciones"
  | "tareas"
  | "suscripcion"
  | "privacidad";

export async function tituloDelPanel(pagina: PaginaDelPanel): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: pagina === "inicio" ? t("perfil.panelDelClub") : t(`menu.enlaces.${pagina}`) };
}
