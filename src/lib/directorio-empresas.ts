import {
  companyPublicRowToProfile,
  type CompanyPublicRow,
} from "@/lib/company-mappers";
import { createPublicClient } from "@/lib/supabase/public";
import type { BudgetBand, CompanyPublicProfile, ObjectiveTag } from "@/lib/types";

/**
 * El directorio de empresas abiertas a patrocinar (migración 0033).
 *
 * Es la mitad que le faltaba a la plataforma. Hasta ahora la empresa
 * buscaba clubes; esto deja que el club busque empresas, que es lo que
 * un club de barrio necesita el día que publica sus oportunidades y no
 * le escribe nadie.
 *
 * Todo sale de `company_public_profiles`, nunca de `companies`: la
 * vista ya filtra a las que se han apuntado y deja fuera el correo y el
 * presupuesto exacto.
 */

export const FRANJAS_PRESUPUESTO: { id: BudgetBand; etiqueta: string }[] = [
  { id: "hasta_500", etiqueta: "Hasta 500 €" },
  { id: "de_500_a_2000", etiqueta: "Entre 500 y 2.000 €" },
  { id: "mas_2000", etiqueta: "Más de 2.000 €" },
];

export const ETIQUETA_FRANJA: Record<BudgetBand, string> = FRANJAS_PRESUPUESTO.reduce(
  (acumulado, franja) => ({ ...acumulado, [franja.id]: franja.etiqueta }),
  {} as Record<BudgetBand, string>,
);

export type FiltrosEmpresas = {
  /** Texto libre: busca en el nombre y en el sector. */
  texto?: string;
  provincia?: string;
  franjas?: BudgetBand[];
  objetivos?: ObjectiveTag[];
};

export const TAMANO_PAGINA_EMPRESAS = 24;

/** Quita lo que no toca y deja solo lo que se puede usar en la consulta. */
export function parametrosAFiltrosEmpresas(
  params: Record<string, string | string[] | undefined>,
): FiltrosEmpresas {
  const uno = (clave: string): string | undefined => {
    const valor = params[clave];
    const texto = Array.isArray(valor) ? valor[0] : valor;
    return texto?.trim() || undefined;
  };

  const lista = (clave: string): string[] => {
    const valor = params[clave];
    if (!valor) return [];
    return (Array.isArray(valor) ? valor : [valor]).flatMap((entrada) => entrada.split(","));
  };

  const franjasValidas = FRANJAS_PRESUPUESTO.map((franja) => franja.id);

  return {
    texto: uno("q"),
    provincia: uno("provincia"),
    franjas: lista("franja").filter((valor): valor is BudgetBand =>
      franjasValidas.includes(valor as BudgetBand),
    ),
    objetivos: lista("objetivo") as ObjectiveTag[],
  };
}

export type ResultadoEmpresas = {
  empresas: CompanyPublicProfile[];
  /** true si hay más allá de esta página. */
  hayMas: boolean;
};

export async function buscarEmpresas(
  filtros: FiltrosEmpresas = {},
  { offset = 0, limite = TAMANO_PAGINA_EMPRESAS }: { offset?: number; limite?: number } = {},
): Promise<ResultadoEmpresas> {
  const supabase = createPublicClient();

  let consulta = supabase
    .from("company_public_profiles")
    .select("*")
    // Las de siempre delante no: las más nuevas, para que una empresa
    // que acaba de apuntarse reciba algo y no se desanime.
    .order("created_at", { ascending: false })
    // Se pide una de más para saber si hay página siguiente sin tener
    // que contar la tabla entera.
    .range(offset, offset + limite);

  if (filtros.texto) {
    const patron = `%${filtros.texto.replace(/[%_]/g, "")}%`;
    consulta = consulta.or(`name.ilike.${patron},sector.ilike.${patron}`);
  }

  if (filtros.provincia) consulta = consulta.ilike("province", `%${filtros.provincia}%`);
  if (filtros.franjas && filtros.franjas.length > 0) {
    consulta = consulta.in("budget_band", filtros.franjas);
  }
  if (filtros.objetivos && filtros.objetivos.length > 0) {
    consulta = consulta.overlaps("objectives", filtros.objetivos);
  }

  const { data, error } = await consulta.returns<CompanyPublicRow[]>();

  if (error || !data) return { empresas: [], hayMas: false };

  return {
    empresas: data.slice(0, limite).map(companyPublicRowToProfile),
    hayMas: data.length > limite,
  };
}

export async function obtenerEmpresaPublica(slug: string): Promise<CompanyPublicProfile | null> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("company_public_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<CompanyPublicRow>();

  return data ? companyPublicRowToProfile(data) : null;
}

/** Las provincias que hay en el directorio, para el desplegable. */
export async function provinciasConEmpresas(): Promise<string[]> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("company_public_profiles")
    .select("province")
    .not("province", "is", null)
    .returns<{ province: string }[]>();

  return [...new Set((data ?? []).map((fila) => fila.province.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
