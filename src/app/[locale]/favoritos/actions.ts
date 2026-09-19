"use server";

import { revalidatePath } from "next/cache";
import { avisarDeFallo } from "@/lib/monitoring";
import { limpiar, type Favorito, type TipoFavorito } from "@/lib/favoritos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Los favoritos de una empresa con cuenta (migración 0046).
 *
 * Quien no tiene cuenta los guarda en su navegador y aquí no entra
 * nunca. Estas acciones son solo para la empresa registrada, y cada una
 * se comprueba a sí misma.
 */

export type EstadoFavorito = { error: string } | { ok: true; guardado: boolean } | null;

async function empresaActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if ((user.app_metadata?.role as Role | undefined) !== "empresa") return null;

  return { supabase, user };
}

function columna(tipo: TipoFavorito): "club_id" | "opportunity_id" {
  return tipo === "club" ? "club_id" : "opportunity_id";
}

/** Guarda o quita. Devuelve si ha quedado guardado. */
export async function alternarFavoritoEnCuenta(
  tipo: TipoFavorito,
  id: string,
): Promise<EstadoFavorito> {
  const sesion = await empresaActual();
  if (!sesion) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if (!id || id.length > 64) return { error: "No se ha podido guardar." };

  const campo = columna(tipo);

  const { data: existente } = await sesion.supabase
    .from("company_favorites")
    .select("id")
    .eq("company_id", sesion.user.id)
    .eq(campo, id)
    .maybeSingle<{ id: string }>();

  if (existente) {
    const { error } = await sesion.supabase
      .from("company_favorites")
      .delete()
      .eq("id", existente.id)
      .eq("company_id", sesion.user.id);

    if (error) {
      avisarDeFallo("empresa", "No se ha podido quitar el favorito", error);
      return { error: "No se ha podido quitar. Inténtalo de nuevo." };
    }

    revalidatePath("/favoritos");
    return { ok: true, guardado: false };
  }

  const { error } = await sesion.supabase
    .from("company_favorites")
    .insert({ company_id: sesion.user.id, [campo]: id });

  if (error) {
    avisarDeFallo("empresa", "No se ha podido guardar el favorito", error);
    return { error: "No se ha podido guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/favoritos");
  return { ok: true, guardado: true };
}

/**
 * Sube a la cuenta lo que estuviera guardado en el navegador.
 *
 * Es la pasarela entre las dos formas de guardar: la empresa marca
 * cosas sin cuenta, un día se registra, y lo que tenía marcado se viene
 * con ella. Sin esto, registrarse castigaría por haber empezado sin
 * cuenta, que es exactamente al revés de lo que interesa.
 *
 * Lo que ya estuviera en la cuenta no se duplica: la base de datos no
 * lo permite (índices únicos de la migración 0046) y aquí se ignoran
 * esos choques a propósito.
 */
export async function subirFavoritosDelNavegador(
  favoritos: unknown,
): Promise<{ subidos: number } | { error: string }> {
  const sesion = await empresaActual();
  if (!sesion) return { error: "No hay sesión de empresa." };

  const limpios: Favorito[] = limpiar(favoritos);
  if (limpios.length === 0) return { subidos: 0 };

  // Las dos columnas en todas las filas, aunque una vaya a null: en un
  // insert de varias a la vez, todas tienen que tener exactamente las
  // mismas claves o se rechaza el lote entero. Con un club y una
  // oportunidad mezclados —que es lo normal— no se guardaba nada.
  const filas = limpios.map((favorito) => ({
    company_id: sesion.user.id,
    club_id: favorito.tipo === "club" ? favorito.id : null,
    opportunity_id: favorito.tipo === "oportunidad" ? favorito.id : null,
  }));

  // `upsert` con ignoreDuplicates: lo que ya tuviera guardado no es un
  // error, es lo normal.
  const { error } = await sesion.supabase
    .from("company_favorites")
    .upsert(filas, { ignoreDuplicates: true });

  if (error) {
    avisarDeFallo("empresa", "No se han podido subir los favoritos del navegador", error);
    return { error: "No se han podido guardar." };
  }

  revalidatePath("/favoritos");
  return { subidos: limpios.length };
}
