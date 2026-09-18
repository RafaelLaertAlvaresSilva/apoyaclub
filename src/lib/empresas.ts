import type { SupabaseClient } from "@supabase/supabase-js";
import { ETIQUETA_CATEGORIA_NECESIDAD, leerCategoriaNecesidad } from "@/lib/opportunities";
import type { CategoriaNecesidad } from "@/lib/types";

/**
 * El otro lado de ApoyaClub: lo que la empresa ofrece.
 *
 * El club publica lo que necesita y lo que vende. Esto es la imagen en
 * espejo: la clínica de fisioterapia que ofrece cuatro sesiones al mes,
 * la imprenta que pone las lonas, la empresa que pone 500 €. Lo que
 * antes solo podía pasar si el club adivinaba a quién llamar.
 *
 * Vive en `company_offers` (migración 0046) y se lee en público a
 * través de `company_offers_public`, que trae ya pegados los datos de
 * la empresa y no expone su correo.
 */

export type TipoDeOferta = "money" | "in_kind" | "service";

export const TIPOS_DE_OFERTA: { id: TipoDeOferta; etiqueta: string; ayuda: string }[] = [
  {
    id: "service",
    etiqueta: "Un servicio",
    ayuda: "Fisioterapia, transporte, diseño, asesoría… lo que tu empresa hace.",
  },
  {
    id: "in_kind",
    etiqueta: "Un producto",
    ayuda: "Material, equipaciones, comida, impresiones… algo que entregas.",
  },
  {
    id: "money",
    etiqueta: "Dinero",
    ayuda: "Un patrocinio en metálico a cambio de visibilidad.",
  },
];

export const ETIQUETA_TIPO_OFERTA: Record<TipoDeOferta, string> = TIPOS_DE_OFERTA.reduce(
  (acumulado, tipo) => ({ ...acumulado, [tipo.id]: tipo.etiqueta }),
  {} as Record<TipoDeOferta, string>,
);

export function leerTipoDeOferta(valor: string): TipoDeOferta | null {
  return TIPOS_DE_OFERTA.some((tipo) => tipo.id === valor) ? (valor as TipoDeOferta) : null;
}

export type EstadoOferta = "available" | "reserved" | "closed";

export const ETIQUETA_ESTADO_OFERTA: Record<EstadoOferta, string> = {
  available: "Disponible",
  reserved: "Apalabrada",
  closed: "Cerrada",
};

export function leerEstadoOferta(valor: string): EstadoOferta | null {
  return valor === "available" || valor === "reserved" || valor === "closed" ? valor : null;
}

/** Una oferta como la ve su dueña, en su panel. */
export type OfertaDeEmpresa = {
  id: string;
  companyId: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoDeOferta;
  categoria: CategoriaNecesidad | null;
  /** Solo en las de dinero. */
  valor: number | null;
  pideACambio: string | null;
  provincia: string | null;
  estado: EstadoOferta;
  archivadaEn: string | null;
  creadaEn: string;
};

/** Una oferta como la ve un club: con la empresa ya pegada. */
export type OfertaPublica = {
  id: string;
  companyId: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoDeOferta;
  categoria: CategoriaNecesidad | null;
  valor: number | null;
  pideACambio: string | null;
  provincia: string | null;
  creadaEn: string;
  empresaSlug: string;
  empresaNombre: string;
  empresaSector: string | null;
  empresaLocalidad: string | null;
  empresaLogoUrl: string | null;
};

type FilaOferta = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  offer_type: string;
  category: string | null;
  value: string | number | null;
  wants: string | null;
  province: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
};

type FilaOfertaPublica = Omit<FilaOferta, "status" | "archived_at"> & {
  company_slug: string;
  company_name: string;
  company_sector: string | null;
  company_city: string | null;
  company_logo_url: string | null;
};

/** `numeric` llega como texto desde Postgres. */
function aNumero(valor: string | number | null): number | null {
  if (valor === null) return null;
  const numero = typeof valor === "number" ? valor : Number.parseFloat(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function filaAOferta(fila: FilaOferta): OfertaDeEmpresa {
  return {
    id: fila.id,
    companyId: fila.company_id,
    titulo: fila.title,
    descripcion: fila.description,
    tipo: leerTipoDeOferta(fila.offer_type) ?? "in_kind",
    categoria: fila.category ? leerCategoriaNecesidad(fila.category) : null,
    valor: aNumero(fila.value),
    pideACambio: fila.wants,
    provincia: fila.province,
    estado: leerEstadoOferta(fila.status) ?? "available",
    archivadaEn: fila.archived_at,
    creadaEn: fila.created_at,
  };
}

export function filaAOfertaPublica(fila: FilaOfertaPublica): OfertaPublica {
  return {
    id: fila.id,
    companyId: fila.company_id,
    titulo: fila.title,
    descripcion: fila.description,
    tipo: leerTipoDeOferta(fila.offer_type) ?? "in_kind",
    categoria: fila.category ? leerCategoriaNecesidad(fila.category) : null,
    valor: aNumero(fila.value),
    pideACambio: fila.wants,
    provincia: fila.province,
    creadaEn: fila.created_at,
    empresaSlug: fila.company_slug,
    empresaNombre: fila.company_name,
    empresaSector: fila.company_sector,
    empresaLocalidad: fila.company_city,
    empresaLogoUrl: fila.company_logo_url,
  };
}

/** Cómo se resume una oferta en una línea: lo que pone y para qué. */
export function resumenDeOferta(oferta: { tipo: TipoDeOferta; categoria: CategoriaNecesidad | null }): string {
  const categoria = oferta.categoria ? ETIQUETA_CATEGORIA_NECESIDAD[oferta.categoria] : null;
  return categoria ? `${ETIQUETA_TIPO_OFERTA[oferta.tipo]} · ${categoria}` : ETIQUETA_TIPO_OFERTA[oferta.tipo];
}

/** Las ofertas de la empresa que ha iniciado sesión, archivadas incluidas. */
export async function obtenerOfertasDeLaEmpresa(
  supabase: SupabaseClient,
  companyId: string,
): Promise<OfertaDeEmpresa[]> {
  const { data, error } = await supabase
    .from("company_offers")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<FilaOferta[]>();

  if (error || !data) return [];
  return data.map(filaAOferta);
}

export type FiltrosDeOfertas = { categoria?: CategoriaNecesidad; provincia?: string; tipo?: TipoDeOferta };

/** Lo que ofrecen las empresas, para que lo vea un club. */
export async function buscarOfertasDeEmpresas(
  supabase: SupabaseClient,
  filtros: FiltrosDeOfertas = {},
  limite = 100,
): Promise<OfertaPublica[]> {
  let consulta = supabase
    .from("company_offers_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (filtros.categoria) consulta = consulta.eq("category", filtros.categoria);
  if (filtros.provincia) consulta = consulta.eq("province", filtros.provincia);
  if (filtros.tipo) consulta = consulta.eq("offer_type", filtros.tipo);

  const { data, error } = await consulta.returns<FilaOfertaPublica[]>();

  // La vista puede no existir todavía (migración sin aplicar): la
  // página se sigue viendo, vacía, en vez de romperse entera.
  if (error || !data) return [];
  return data.map(filaAOfertaPublica);
}

/** Las ofertas de una empresa concreta, para su ficha pública. */
export async function obtenerOfertasPublicas(
  supabase: SupabaseClient,
  companySlug: string,
): Promise<OfertaPublica[]> {
  const { data, error } = await supabase
    .from("company_offers_public")
    .select("*")
    .eq("company_slug", companySlug)
    .order("created_at", { ascending: false })
    .returns<FilaOfertaPublica[]>();

  if (error || !data) return [];
  return data.map(filaAOfertaPublica);
}

/** Las provincias en las que hay alguna oferta, para el filtro. */
export async function provinciasConOfertas(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("company_offers_public")
    .select("province")
    .returns<{ province: string | null }[]>();

  if (error || !data) return [];
  return [...new Set(data.map((fila) => fila.province).filter((valor): valor is string => !!valor))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

/**
 * Cómo se contacta con una empresa.
 *
 * Vive en `companies` (migración 0047) y nunca en la vista pública: se
 * sirve detrás de un clic, igual que el del club, para que no lo
 * recojan los robots de spam.
 */
export type ContactoEmpresa = {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  /** Si no, no se enseña a nadie. */
  publico: boolean;
};

/**
 * Una empresa puede publicar cuando se puede contactar con ella.
 *
 * Con el correo o con el teléfono basta; los dos es mejor. Sin ninguno
 * de los dos, la oferta es un cartel con el teléfono arrancado: el club
 * la lee, le encaja y no tiene a dónde ir.
 */
export function sePuedeContactar(contacto: {
  email: string | null;
  telefono: string | null;
}): boolean {
  return !!contacto.email?.trim() || !!contacto.telefono?.trim();
}
