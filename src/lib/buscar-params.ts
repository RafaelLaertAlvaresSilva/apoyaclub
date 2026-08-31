import { FORMAS_COLABORACION, OBJETIVOS_OPORTUNIDAD, PERIODOS_OPORTUNIDAD, TIPOS_OPORTUNIDAD } from "@/lib/opportunities";
import type { FiltrosBusqueda, OrdenBusqueda, VistaBusqueda } from "@/lib/search-types";
import type { TeamLevel } from "@/lib/types";

/**
 * Traduce entre los filtros del buscador (`FiltrosBusqueda`) y los
 * parámetros de la URL de `/buscar`, en los dos sentidos, para que una
 * búsqueda se pueda compartir con una URL (requisito de la Fase 7).
 * Nombres de parámetro cortos y en español, ya que es lo único de la URL
 * que ve la persona que la comparte.
 */

export type ParametrosURL = { [clave: string]: string | string[] | undefined };

const IDS_TIPO = new Set(TIPOS_OPORTUNIDAD.map((t) => t.id as string));
const IDS_FORMA = new Set(FORMAS_COLABORACION.map((f) => f.id as string));
const IDS_OBJETIVO = new Set(OBJETIVOS_OPORTUNIDAD.map((o) => o.id as string));
const IDS_PERIODO = new Set(PERIODOS_OPORTUNIDAD.map((p) => p.id as string));
const NIVELES_VALIDOS = new Set<TeamLevel>(["primer_equipo", "cantera"]);
const ORDENES_VALIDOS = new Set<OrdenBusqueda>(["cercania", "valor", "novedad"]);

export const RADIOS_KM = [10, 25, 50, 100, 200] as const;

export const OPCIONES_ORDEN: { id: OrdenBusqueda; etiqueta: string }[] = [
  { id: "novedad", etiqueta: "Más recientes" },
  { id: "valor", etiqueta: "Mayor valor" },
  { id: "cercania", etiqueta: "Más cerca" },
];

function unParametro(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const limpio = texto?.trim();
  return limpio ? limpio : undefined;
}

function listaDesdeParametro<T extends string>(valor: string | string[] | undefined, validos: Set<string>): T[] {
  const texto = unParametro(valor);
  if (!texto) return [];
  return texto
    .split(",")
    .map((v) => v.trim())
    .filter((v) => validos.has(v)) as T[];
}

function numeroDesdeParametro(valor: string | string[] | undefined): number | undefined {
  const texto = unParametro(valor);
  if (!texto) return undefined;
  const numero = Number.parseFloat(texto);
  return Number.isFinite(numero) && numero >= 0 ? numero : undefined;
}

export function parametrosAFiltros(params: ParametrosURL): { filtros: FiltrosBusqueda; vista: VistaBusqueda } {
  const nivel = unParametro(params.nivel);
  const orden = unParametro(params.orden);

  const filtros: FiltrosBusqueda = {
    provincia: unParametro(params.provincia),
    ubicacion: unParametro(params.ubicacion),
    radioKm: numeroDesdeParametro(params.radio),
    deporte: unParametro(params.deporte),
    categoria: unParametro(params.categoria),
    genero: unParametro(params.genero),
    nivelEquipo: nivel && NIVELES_VALIDOS.has(nivel as TeamLevel) ? (nivel as TeamLevel) : undefined,
    tipos: listaDesdeParametro(params.tipo, IDS_TIPO),
    presupuestoMin: numeroDesdeParametro(params.min),
    presupuestoMax: numeroDesdeParametro(params.max),
    periodo: (() => {
      const p = unParametro(params.periodo);
      return p && IDS_PERIODO.has(p) ? (p as FiltrosBusqueda["periodo"]) : undefined;
    })(),
    formasColaboracion: listaDesdeParametro(params.forma, IDS_FORMA),
    objetivos: listaDesdeParametro(params.objetivo, IDS_OBJETIVO),
    orden: orden && ORDENES_VALIDOS.has(orden as OrdenBusqueda) ? (orden as OrdenBusqueda) : "novedad",
  };

  const vista: VistaBusqueda = unParametro(params.vista) === "club" ? "club" : "oportunidad";

  return { filtros, vista };
}

/** Construye la query string de `/buscar` a partir de los filtros y la vista actuales. */
export function filtrosAQueryString(filtros: FiltrosBusqueda, vista: VistaBusqueda): string {
  const qs = new URLSearchParams();

  if (filtros.provincia) qs.set("provincia", filtros.provincia);
  if (filtros.ubicacion) qs.set("ubicacion", filtros.ubicacion);
  if (filtros.radioKm) qs.set("radio", String(filtros.radioKm));
  if (filtros.deporte) qs.set("deporte", filtros.deporte);
  if (filtros.categoria) qs.set("categoria", filtros.categoria);
  if (filtros.genero) qs.set("genero", filtros.genero);
  if (filtros.nivelEquipo) qs.set("nivel", filtros.nivelEquipo);
  if (filtros.tipos && filtros.tipos.length > 0) qs.set("tipo", filtros.tipos.join(","));
  if (filtros.presupuestoMin != null) qs.set("min", String(filtros.presupuestoMin));
  if (filtros.presupuestoMax != null) qs.set("max", String(filtros.presupuestoMax));
  if (filtros.periodo) qs.set("periodo", filtros.periodo);
  if (filtros.formasColaboracion && filtros.formasColaboracion.length > 0) {
    qs.set("forma", filtros.formasColaboracion.join(","));
  }
  if (filtros.objetivos && filtros.objetivos.length > 0) qs.set("objetivo", filtros.objetivos.join(","));
  if (filtros.orden && filtros.orden !== "novedad") qs.set("orden", filtros.orden);
  if (vista !== "oportunidad") qs.set("vista", vista);

  return qs.toString();
}
