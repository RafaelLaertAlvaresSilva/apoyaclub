"use server";

import { revalidatePath } from "next/cache";
import { obtenerEmpresaActual } from "@/app/[locale]/empresa/actions";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_FAVORITOS = "/empresa/favoritos";

// ---------------------------------------------------------------------
// Listas
// ---------------------------------------------------------------------
export async function crearListaFavoritos(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Indica un nombre para la lista." };

  const { error } = await supabase
    .from("company_favorite_lists")
    .insert({ company_id: user.id, name });

  if (error) {
    if (error.code === "23505") return { error: "Ya tienes una lista con ese nombre." };
    return { error: "No se ha podido crear la lista." };
  }

  revalidatePath(RUTA_FAVORITOS);
  return { ok: true };
}

export async function renombrarListaFavoritos(formData: FormData): Promise<void> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await supabase
    .from("company_favorite_lists")
    .update({ name })
    .eq("id", id)
    .eq("company_id", user.id);

  revalidatePath(RUTA_FAVORITOS);
}

export async function eliminarListaFavoritos(formData: FormData): Promise<void> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("company_favorite_lists").delete().eq("id", id).eq("company_id", user.id);
  revalidatePath(RUTA_FAVORITOS);
}

// ---------------------------------------------------------------------
// Favoritos (elementos guardados dentro de una lista)
// ---------------------------------------------------------------------
export async function eliminarFavorito(formData: FormData): Promise<void> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return;
  const { supabase, user } = contexto;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("company_favorites").delete().eq("id", id).eq("company_id", user.id);
  revalidatePath(RUTA_FAVORITOS);
}

// ---------------------------------------------------------------------
// Usadas desde el botón "Guardar en favoritos" de la página pública del
// club (Fase 8).
// ---------------------------------------------------------------------
export type ListaConEstado = { id: string; name: string; guardado: boolean };

/** Lee las listas de la empresa y si la oportunidad ya está guardada en cada una. */
export async function obtenerListasParaOportunidad(
  opportunityId: string,
): Promise<{ listas: ListaConEstado[] } | { error: string }> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const [{ data: listas }, { data: favoritos }] = await Promise.all([
    supabase
      .from("company_favorite_lists")
      .select("id, name")
      .eq("company_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("company_favorites")
      .select("list_id")
      .eq("company_id", user.id)
      .eq("opportunity_id", opportunityId),
  ]);

  const listasGuardadas = new Set((favoritos ?? []).map((favorito) => favorito.list_id as string));

  return {
    listas: (listas ?? []).map((lista) => ({
      id: lista.id as string,
      name: lista.name as string,
      guardado: listasGuardadas.has(lista.id as string),
    })),
  };
}

/** Alterna (guarda/quita) una oportunidad en una lista de favoritos. */
export async function alternarFavorito(
  listId: string,
  opportunityId: string,
): Promise<{ guardado: boolean } | { error: string }> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const { data: existente } = await supabase
    .from("company_favorites")
    .select("id")
    .eq("company_id", user.id)
    .eq("list_id", listId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existente) {
    await supabase.from("company_favorites").delete().eq("id", existente.id);
    revalidatePath(RUTA_FAVORITOS);
    return { guardado: false };
  }

  const { error } = await supabase
    .from("company_favorites")
    .insert({ company_id: user.id, list_id: listId, opportunity_id: opportunityId });

  if (error) return { error: "No se ha podido guardar en la lista." };

  revalidatePath(RUTA_FAVORITOS);
  return { guardado: true };
}

/** Crea una lista nueva y guarda directamente la oportunidad en ella
 * (atajo del selector rápido de la página pública del club). */
export async function crearListaYGuardar(
  name: string,
  opportunityId: string,
): Promise<{ lista: ListaConEstado } | { error: string }> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const nombre = name.trim();
  if (!nombre) return { error: "Indica un nombre para la lista." };

  const { data: lista, error } = await supabase
    .from("company_favorite_lists")
    .insert({ company_id: user.id, name: nombre })
    .select("id, name")
    .single();

  if (error || !lista) {
    if (error?.code === "23505") return { error: "Ya tienes una lista con ese nombre." };
    return { error: "No se ha podido crear la lista." };
  }

  await supabase
    .from("company_favorites")
    .insert({ company_id: user.id, list_id: lista.id, opportunity_id: opportunityId });

  revalidatePath(RUTA_FAVORITOS);
  return { lista: { id: lista.id as string, name: lista.name as string, guardado: true } };
}
