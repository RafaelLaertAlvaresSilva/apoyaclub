import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Servicios que un club necesita (migración 0016).
 *
 * La otra dirección de la plataforma: no lo que el club ofrece, sino lo
 * que le hace falta. Es la puerta de entrada de la empresa pequeña que
 * no tiene presupuesto de patrocinio pero sí una clínica, una furgoneta
 * o una imprenta.
 */

export type ServiceCategory =
  | "salud"
  | "transporte"
  | "hosteleria"
  | "material"
  | "imprenta"
  | "formacion"
  | "otros";

export type ServiceNeedStatus = "open" | "covered";

export type ServiceNeed = {
  id: string;
  clubId: string;
  category: ServiceCategory;
  title: string;
  description: string | null;
  status: ServiceNeedStatus;
  createdAt: string;
};

/** Necesidad tal y como la ve una empresa: con los datos del club. */
export type ServiceNeedPublica = Omit<ServiceNeed, "status"> & {
  clubSlug: string;
  clubName: string;
  clubCity: string;
  clubProvince: string | null;
  clubLogoUrl: string | null;
};

export const CATEGORIAS_SERVICIO: { id: ServiceCategory; etiqueta: string; ejemplos: string }[] = [
  { id: "salud", etiqueta: "Salud y recuperación", ejemplos: "Fisioterapia, podología, nutrición, seguro médico" },
  { id: "transporte", etiqueta: "Transporte", ejemplos: "Autobús a desplazamientos, furgoneta, taller" },
  { id: "hosteleria", etiqueta: "Hostelería", ejemplos: "Comidas de equipo, catering de eventos, alojamiento" },
  { id: "material", etiqueta: "Material y equipación", ejemplos: "Balones, ropa de entrenamiento, gimnasio" },
  { id: "imprenta", etiqueta: "Imprenta y diseño", ejemplos: "Carteles, vinilos, fotografía, vídeo" },
  { id: "formacion", etiqueta: "Servicios profesionales", ejemplos: "Gestoría, seguros, informática, formación" },
  { id: "otros", etiqueta: "Otros", ejemplos: "Cualquier cosa que tu club necesite" },
];

export const ETIQUETA_CATEGORIA_SERVICIO: Record<ServiceCategory, string> = CATEGORIAS_SERVICIO.reduce(
  (acumulado, categoria) => ({ ...acumulado, [categoria.id]: categoria.etiqueta }),
  {} as Record<ServiceCategory, string>,
);

export const CATEGORIAS_VALIDAS: ServiceCategory[] = CATEGORIAS_SERVICIO.map((categoria) => categoria.id);

export function esCategoriaValida(valor: string): valor is ServiceCategory {
  return (CATEGORIAS_VALIDAS as string[]).includes(valor);
}

export type FilaServicio = {
  id: string;
  club_id: string;
  category: ServiceCategory;
  title: string;
  description: string | null;
  status: ServiceNeedStatus;
  created_at: string;
};

export function filaAServicio(fila: FilaServicio): ServiceNeed {
  return {
    id: fila.id,
    clubId: fila.club_id,
    category: fila.category,
    title: fila.title,
    description: fila.description,
    status: fila.status,
    createdAt: fila.created_at,
  };
}

type FilaServicioPublico = Omit<FilaServicio, "status"> & {
  club_slug: string;
  club_name: string;
  club_city: string;
  club_province: string | null;
  club_logo_url: string | null;
};

export function filaAServicioPublico(fila: FilaServicioPublico): ServiceNeedPublica {
  return {
    id: fila.id,
    clubId: fila.club_id,
    category: fila.category,
    title: fila.title,
    description: fila.description,
    createdAt: fila.created_at,
    clubSlug: fila.club_slug,
    clubName: fila.club_name,
    clubCity: fila.club_city,
    clubProvince: fila.club_province,
    clubLogoUrl: fila.club_logo_url,
  };
}

/** Servicios abiertos de un club concreto, para su página pública. */
export async function obtenerServiciosDelClub(
  supabase: SupabaseClient,
  clubId: string,
): Promise<ServiceNeedPublica[]> {
  const { data, error } = await supabase
    .from("club_service_needs_public")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .returns<FilaServicioPublico[]>();

  // La tabla puede no existir todavía (migración sin aplicar): la ficha
  // del club se sigue viendo, sin esta sección.
  if (error || !data) return [];
  return data.map(filaAServicioPublico);
}

/** Listado público con filtros, para /servicios. */
export async function buscarServicios(
  supabase: SupabaseClient,
  filtros: { categoria?: ServiceCategory; provincia?: string } = {},
): Promise<ServiceNeedPublica[]> {
  let consulta = supabase
    .from("club_service_needs_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filtros.categoria) consulta = consulta.eq("category", filtros.categoria);
  if (filtros.provincia) consulta = consulta.eq("club_province", filtros.provincia);

  const { data, error } = await consulta.returns<FilaServicioPublico[]>();
  if (error || !data) return [];
  return data.map(filaAServicioPublico);
}
