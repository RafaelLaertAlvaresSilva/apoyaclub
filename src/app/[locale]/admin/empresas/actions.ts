"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const RUTA_EMPRESAS = "/admin/empresas";

/** Qué ha pasado al pulsar un botón del listado (igual que en clubes). */
export type AvisoAdminEmpresa =
  | "suspendida"
  | "reactivada"
  | "modo-pruebas"
  | "fuera-de-pruebas"
  | "sin-ficha"
  | "no-admin";

async function volverConAviso(aviso: AvisoAdminEmpresa): Promise<void> {
  const locale = await getLocale();
  redirect({ href: `${RUTA_EMPRESAS}?aviso=${aviso}`, locale });
}

/**
 * Cada acción se comprueba a sí misma, aunque el middleware y el layout
 * ya protejan `/admin`: es lo mismo que hacen las de clubes.
 */
async function actualizarEmpresa(formData: FormData, cambios: Record<string, unknown>, aviso: AvisoAdminEmpresa) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.app_metadata?.role as Role | undefined) !== "admin") return volverConAviso("no-admin");

  const id = String(formData.get("id") ?? "");
  if (!id) return volverConAviso("no-admin");

  const admin = createAdminClient();
  const { data: actualizadas } = await admin.from("companies").update(cambios).eq("id", id).select("id");

  // Una empresa que todavía no ha guardado su ficha no tiene fila en
  // `companies`: no hay nada que esconder ni que suspender. Se dice en
  // vez de fingir que ha funcionado.
  if (!actualizadas || actualizadas.length === 0) return volverConAviso("sin-ficha");

  revalidatePath(RUTA_EMPRESAS);
  return volverConAviso(aviso);
}

/** Pierde el panel y desaparece de todo lo público y de los avisos. */
export async function suspenderEmpresa(formData: FormData): Promise<void> {
  await actualizarEmpresa(
    formData,
    { admin_suspended: true, admin_suspended_at: new Date().toISOString() },
    "suspendida",
  );
}

export async function reactivarEmpresa(formData: FormData): Promise<void> {
  await actualizarEmpresa(formData, { admin_suspended: false, admin_suspended_at: null }, "reactivada");
}

/** Desaparece de todo lo público, pero conserva su panel. */
export async function activarModoPruebasEmpresa(formData: FormData): Promise<void> {
  await actualizarEmpresa(
    formData,
    { admin_test_mode: true, admin_test_mode_at: new Date().toISOString() },
    "modo-pruebas",
  );
}

export async function quitarModoPruebasEmpresa(formData: FormData): Promise<void> {
  await actualizarEmpresa(formData, { admin_test_mode: false, admin_test_mode_at: null }, "fuera-de-pruebas");
}
