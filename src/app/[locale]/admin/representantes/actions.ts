"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { PORCENTAJE_POR_DEFECTO } from "@/lib/acceso-admin";
import { accesoAdminDeLaAccion } from "@/lib/acceso-admin-servidor";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { esPaisValido, type Pais } from "@/lib/paises";
import { createAdminClient } from "@/lib/supabase/admin";

const RUTA = "/admin/representantes";

export type AvisoRepresentantes =
  | "creado"
  | "correo-enviado"
  | "desactivado"
  | "reactivado"
  | "datos"
  | "ya-existe"
  | "fallo"
  | "no-admin";

async function volver(aviso: AvisoRepresentantes): Promise<void> {
  const locale = await getLocale();
  redirect({ href: `${RUTA}?aviso=${aviso}`, locale });
}

/** El idioma de la web de cada país, para el enlace del correo. */
const IDIOMA_DEL_PAIS: Record<Pais, string> = { ES: "es", PT: "pt", BR: "br" };

/**
 * El código de su enlace propio: el país y un número (BR1, BR2…). Va
 * en `?a=` igual que la letra de los anuncios, así que entra por el
 * mismo sitio en el registro y sale marcado en la lista de clubes.
 */
async function codigoNuevo(pais: Pais): Promise<string> {
  const existentes = new Set(
    (await obtenerUsuariosPorRol("representante")).map((representante) => String(representante.appMetadata.codigo ?? "")),
  );
  let numero = 1;
  while (existentes.has(`${pais}${numero}`)) numero += 1;
  return `${pais}${numero}`;
}

/**
 * Le manda el correo para poner su contraseña. Es el mismo de
 * "¿Has olvidado tu contraseña?": lleva a la página donde se elige una
 * nueva, y de ahí, al entrar, a su lista de clubes.
 */
async function mandarCorreoDeContrasena(email: string, pais: Pais): Promise<boolean> {
  const origin = (await headers()).get("origin");
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${IDIOMA_DEL_PAIS[pais]}/auth/callback?next=/actualizar-password`,
  });
  return !error;
}

/**
 * Da de alta a un representante: su cuenta, con el rol, el país y el
 * porcentaje en `app_metadata` (que él no puede tocar), y el correo
 * para que elija su contraseña.
 *
 * No se reutiliza una cuenta que ya exista con ese correo: si es la de
 * un club o una empresa, convertirla le quitaría su panel.
 */
export async function crearRepresentante(formData: FormData): Promise<void> {
  const acceso = await accesoAdminDeLaAccion();
  if (acceso?.tipo !== "admin") return volver("no-admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pais = formData.get("pais");
  const porcentaje = Number(formData.get("porcentaje") ?? PORCENTAJE_POR_DEFECTO);

  if (!email.includes("@") || !esPaisValido(pais) || !Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    return volver("datos");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: "representante", pais, porcentaje, codigo: await codigoNuevo(pais), activo: true },
  });

  if (error) {
    return volver(/already|registered|exists/i.test(error.message) ? "ya-existe" : "fallo");
  }

  await mandarCorreoDeContrasena(email, pais);
  revalidatePath(RUTA);
  return volver("creado");
}

async function representanteDelFormulario(formData: FormData) {
  const acceso = await accesoAdminDeLaAccion();
  if (acceso?.tipo !== "admin") return null;

  const id = String(formData.get("id") ?? "");
  if (!id) return null;

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(id);
  if (!data?.user || data.user.app_metadata?.role !== "representante") return null;
  return { admin, usuario: data.user };
}

/** Vuelve a mandarle el correo para poner la contraseña. */
export async function reenviarCorreo(formData: FormData): Promise<void> {
  const contexto = await representanteDelFormulario(formData);
  if (!contexto?.usuario.email) return volver("no-admin");

  const pais = esPaisValido(contexto.usuario.app_metadata.pais) ? contexto.usuario.app_metadata.pais : "ES";
  return volver((await mandarCorreoDeContrasena(contexto.usuario.email, pais)) ? "correo-enviado" : "fallo");
}

/**
 * Le quita el acceso sin borrar la cuenta: así se conserva su historial
 * de comisiones. Además de marcarlo inactivo, se le bloquea la cuenta,
 * para que no pueda ni iniciar sesión.
 */
export async function desactivarRepresentante(formData: FormData): Promise<void> {
  const contexto = await representanteDelFormulario(formData);
  if (!contexto) return volver("no-admin");

  await contexto.admin.auth.admin.updateUserById(contexto.usuario.id, {
    app_metadata: { ...contexto.usuario.app_metadata, activo: false },
    ban_duration: "876000h",
  });
  revalidatePath(RUTA);
  return volver("desactivado");
}

export async function reactivarRepresentante(formData: FormData): Promise<void> {
  const contexto = await representanteDelFormulario(formData);
  if (!contexto) return volver("no-admin");

  await contexto.admin.auth.admin.updateUserById(contexto.usuario.id, {
    app_metadata: { ...contexto.usuario.app_metadata, activo: true },
    ban_duration: "none",
  });
  revalidatePath(RUTA);
  return volver("reactivado");
}
