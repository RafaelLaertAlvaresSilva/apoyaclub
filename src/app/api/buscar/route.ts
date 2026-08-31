import { NextResponse } from "next/server";
import { parametrosAFiltros } from "@/lib/buscar-params";
import { buscarOportunidades } from "@/lib/search";

/**
 * Usado por el botón "Cargar más" de `/buscar` (Fase 7): la primera
 * página de resultados se renderiza en el servidor (rápida, indexable,
 * compartible por URL), y las siguientes se piden aquí desde el cliente
 * para no recargar toda la página cada vez.
 */

export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | undefined> = {};
  for (const [clave, valor] of url.searchParams.entries()) {
    params[clave] = valor;
  }

  const { filtros } = parametrosAFiltros(params);
  const desde = Number.parseInt(url.searchParams.get("desde") ?? "0", 10);
  const offset = Number.isFinite(desde) && desde >= 0 ? desde : 0;

  const pagina = await buscarOportunidades(filtros, { offset, limite: TAMANO_PAGINA });

  return NextResponse.json(pagina);
}
