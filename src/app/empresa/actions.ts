"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ObjectiveTag, Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_EMPRESA = "/empresa";

const OBJETIVOS_VALIDOS: ObjectiveTag[] = [
  "familias",
  "jovenes",
  "comunidad_local",
  "deporte_femenino",
  "deporte_base",
  "visibilidad",
  "contenido",
  "clientes",
  "empleados",
  "rsc",
];

/**
 * Igual que `obtenerClubActual` de `app/panel/actions.ts`: recupera el
 * cliente de Supabase y el usuario autenticado, comprobando que tiene
 * rol "empresa". El middleware ya protege `/empresa`, pero cada Server
 * Action se valida a sí misma por si se invocara desde otro sitio.
 */
export async function obtenerEmpresaActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const rol = user.app_metadata?.role as Role | undefined;
  if (rol !== "empresa") {
    return { error: "Esta acción solo está disponible para empresas." };
  }

  return { supabase, user };
}

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function leerDecimal(formData: FormData, campo: string): number | null {
  const valor = String(formData.get(campo) ?? "").trim();
  if (valor === "") return null;
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function leerObjetivos(formData: FormData): ObjectiveTag[] {
  return formData
    .getAll("objectives")
    .map((valor) => String(valor))
    .filter((valor): valor is ObjectiveTag => (OBJETIVOS_VALIDOS as string[]).includes(valor));
}

// ---------------------------------------------------------------------
// Perfil de empresa
// ---------------------------------------------------------------------
export async function guardarPerfilEmpresa(
  _estadoPrevio: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const contexto = await obtenerEmpresaActual();
  if ("error" in contexto) return { error: contexto.error };
  const { supabase, user } = contexto;

  const budgetMin = leerDecimal(formData, "budgetMin");
  const budgetMax = leerDecimal(formData, "budgetMax");
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    return { error: "El presupuesto mínimo no puede ser mayor que el máximo." };
  }

  const { error } = await supabase.from("companies").upsert({
    id: user.id,
    name: leerTexto(formData, "name"),
    sector: leerTexto(formData, "sector"),
    city: leerTexto(formData, "city"),
    website: leerTexto(formData, "website"),
    budget_min: budgetMin,
    budget_max: budgetMax,
    objectives: leerObjetivos(formData),
  });

  if (error) return { error: "No se ha podido guardar el perfil." };

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}
