"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { avisarDeFallo } from "@/lib/monitoring";
import { leerCategoriaNecesidad } from "@/lib/opportunities";
import { leerEstadoOferta, leerTipoDeOferta, sePuedeContactar } from "@/lib/empresas";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type EstadoGuardado = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA_EMPRESA = "/empresa";

/**
 * Sesión con rol "empresa". Cada acción se comprueba a sí misma aunque
 * el middleware y el layout ya protejan la ruta: mismo criterio que en
 * el panel del club.
 */
async function obtenerEmpresaActual(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if ((user.app_metadata?.role as Role | undefined) !== "empresa") {
    return { error: "Esta acción solo está disponible para empresas." };
  }

  return { supabase, user };
}

function leerTexto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

/** Igual que en el panel del club: al usuario se le dice algo que pueda
 * entender, pero el motivo técnico no se pierde. */
function fallo(operacion: string, error: unknown, mensaje: string): EstadoGuardado {
  avisarDeFallo("empresa", `No se ha podido ${operacion}`, error);
  return { error: mensaje };
}

/** El importe, solo en las ofertas de dinero. */
function leerValor(formData: FormData, tipo: string): number | null {
  if (tipo !== "money") return null;
  const bruto = String(formData.get("valor") ?? "").replace(",", ".").trim();
  if (!bruto) return null;
  const numero = Number.parseFloat(bruto);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

type DatosDeOferta = {
  title: string;
  description: string | null;
  offer_type: string;
  category: string | null;
  value: number | null;
  wants: string | null;
  province: string | null;
};

/** Lee y comprueba el formulario. Mismo camino para el alta y la
 * edición, para que no puedan separarse con el tiempo. */
function leerFormulario(formData: FormData): DatosDeOferta | { error: string } {
  const title = String(formData.get("titulo") ?? "").trim();
  if (title.length < 3) return { error: "Escribe qué ofreces, con algo más de detalle." };
  if (title.length > 150) return { error: "El título es demasiado largo." };

  const tipo = leerTipoDeOferta(String(formData.get("tipo") ?? ""));
  if (!tipo) return { error: "Elige si ofreces un servicio, un producto o dinero." };

  const categoriaBruta = String(formData.get("categoria") ?? "");
  const category = categoriaBruta ? leerCategoriaNecesidad(categoriaBruta) : null;

  return {
    title: title.slice(0, 150),
    description: leerTexto(formData, "descripcion")?.slice(0, 1000) ?? null,
    offer_type: tipo,
    category,
    value: leerValor(formData, tipo),
    wants: leerTexto(formData, "pideACambio")?.slice(0, 500) ?? null,
    province: leerTexto(formData, "provincia"),
  };
}

type DatosDeContacto = {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_public_consent: boolean;
};

/**
 * El contacto que viaja con el formulario de la oferta.
 *
 * Va en la ficha de la empresa y no en cada oferta, porque una empresa
 * tiene un contacto y no uno por anuncio. Se pide aquí de todas formas
 * —relleno con lo que ya haya— porque este es el momento en que hace
 * falta: publicar sin forma de contacto deja al club con la oferta
 * leída y ningún sitio al que ir.
 */
function leerContacto(formData: FormData): DatosDeContacto | { error: string } {
  const contacto = {
    contact_name: leerTexto(formData, "contactoNombre")?.slice(0, 120) ?? null,
    contact_email: leerTexto(formData, "contactoEmail")?.slice(0, 200) ?? null,
    contact_phone: leerTexto(formData, "contactoTelefono")?.slice(0, 40) ?? null,
    contact_public_consent: formData.get("contactoPublico") === "on",
  };

  if (!sePuedeContactar({ email: contacto.contact_email, telefono: contacto.contact_phone })) {
    return { error: "Pon un correo o un teléfono: sin eso, el club no puede escribirte." };
  }

  if (contacto.contact_email && !contacto.contact_email.includes("@")) {
    return { error: "Ese correo no parece un correo." };
  }

  return contacto;
}

export async function crearOferta(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const datos = leerFormulario(formData);
  if ("error" in datos) return { error: datos.error };

  const contacto = leerContacto(formData);
  if ("error" in contacto) return { error: contacto.error };

  // El contacto primero: si esto falla, no queremos una oferta
  // publicada a la que nadie pueda responder.
  const { error: errorContacto } = await sesion.supabase
    .from("companies")
    .update(contacto)
    .eq("id", sesion.user.id);

  if (errorContacto) {
    return fallo("guardar el contacto", errorContacto, "No se ha podido guardar. Inténtalo de nuevo.");
  }

  const { error } = await sesion.supabase
    .from("company_offers")
    .insert({ ...datos, company_id: sesion.user.id });

  if (error) return fallo("crear la oferta", error, "No se ha podido publicar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}

export async function editarOferta(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha encontrado la oferta." };

  const datos = leerFormulario(formData);
  if ("error" in datos) return { error: datos.error };

  const contacto = leerContacto(formData);
  if ("error" in contacto) return { error: contacto.error };

  const { error: errorContacto } = await sesion.supabase
    .from("companies")
    .update(contacto)
    .eq("id", sesion.user.id);

  if (errorContacto) {
    return fallo("guardar el contacto", errorContacto, "No se ha podido guardar. Inténtalo de nuevo.");
  }

  // El `company_id` va en el update además de en la regla de fila: si
  // algún día se tocara la RLS, esto sigue impidiendo editar la oferta
  // de otra empresa.
  const { error } = await sesion.supabase
    .from("company_offers")
    .update(datos)
    .eq("id", id)
    .eq("company_id", sesion.user.id);

  if (error) return fallo("editar la oferta", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}

/** Disponible, apalabrada o cerrada. No borra nada. */
export async function cambiarEstadoOferta(formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  const estado = leerEstadoOferta(String(formData.get("estado") ?? ""));
  if (!id || !estado) return { error: "No se ha podido cambiar el estado." };

  const { error } = await sesion.supabase
    .from("company_offers")
    .update({ status: estado })
    .eq("id", id)
    .eq("company_id", sesion.user.id);

  if (error) return fallo("cambiar el estado", error, "No se ha podido cambiar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}

/**
 * Archiva o desarchiva. Archivar la quita del directorio sin borrarla:
 * la empresa que cubre un acuerdo este año suele volver a ofrecer lo
 * mismo al siguiente, y volver a escribirlo entero es la mejor forma de
 * que no lo haga.
 */
export async function archivarOferta(formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha encontrado la oferta." };

  const desarchivar = String(formData.get("desarchivar") ?? "") === "si";

  const { error } = await sesion.supabase
    .from("company_offers")
    .update({ archived_at: desarchivar ? null : new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", sesion.user.id);

  if (error) return fallo("archivar la oferta", error, "No se ha podido archivar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}

export async function borrarOferta(formData: FormData): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const id = leerTexto(formData, "id");
  if (!id) return { error: "No se ha encontrado la oferta." };

  const { error } = await sesion.supabase
    .from("company_offers")
    .delete()
    .eq("id", id)
    .eq("company_id", sesion.user.id);

  if (error) return fallo("borrar la oferta", error, "No se ha podido borrar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  return { ok: true };
}

/**
 * La ficha de la empresa: lo que ve un club en el directorio.
 *
 * Todo es opcional a propósito. La empresa se registró para ofrecer
 * algo, no para rellenar un perfil, y una ficha a medias se ve
 * perfectamente.
 */
export async function guardarFichaEmpresa(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const sesion = await obtenerEmpresaActual();
  if ("error" in sesion) return { error: sesion.error };

  const name = leerTexto(formData, "nombre");
  if (!name) return { error: "El nombre de la empresa no puede quedarse vacío." };

  const contacto = leerContacto(formData);
  if ("error" in contacto) return { error: contacto.error };

  const { error } = await sesion.supabase
    .from("companies")
    .update({
      name: name.slice(0, 150),
      sector: leerTexto(formData, "sector"),
      city: leerTexto(formData, "localidad"),
      province: leerTexto(formData, "provincia"),
      website: leerTexto(formData, "web"),
      description: leerTexto(formData, "descripcion")?.slice(0, 600) ?? null,
      open_to_sponsor: formData.get("enElDirectorio") === "on",
      alerts_enabled: formData.get("quiereAvisos") === "on",
      // Ya subido: lo que llega es la dirección pública, no el archivo.
      logo_url: leerTexto(formData, "logoUrl"),
      ...contacto,
    })
    .eq("id", sesion.user.id);

  if (error) return fallo("guardar la ficha", error, "No se ha podido guardar. Inténtalo de nuevo.");

  revalidatePath(RUTA_EMPRESA);
  revalidatePath("/empresas");
  return { ok: true };
}
