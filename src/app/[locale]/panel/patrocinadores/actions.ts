"use server";

import { revalidatePath } from "next/cache";
import { avisarDeFallo } from "@/lib/monitoring";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  BUCKET_DOCUMENTOS,
  contarDocumentosDelPatrocinador,
} from "@/lib/documentos-datos";
import {
  esTipoValido,
  mensajeDelProblema,
  nombreLimpio,
  problemaAlSubir,
  rutaDelDocumento,
} from "@/lib/documentos-patrocinio";
import type { Role } from "@/lib/types";

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

export type EstadoDocumento = { error: string; ok?: false } | { ok: true; error?: undefined } | null;

const RUTA = "/panel/patrocinadores";

/**
 * La sesión, y que sea de un club.
 *
 * Cada acción se valida a sí misma aunque el middleware ya proteja
 * `/panel`: una Server Action es una dirección más, y se le puede
 * llamar sin pasar por la pantalla que la enseña.
 */
type Sesion =
  | { error: string; supabase?: undefined; user?: undefined }
  | { error?: undefined; supabase: SupabaseServidor; user: User };

async function clubDeLaSesion(): Promise<Sesion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  if ((user.app_metadata?.role as Role | undefined) !== "club") {
    return { error: "Esta acción solo está disponible para clubes." };
  }
  return { supabase, user };
}

/** El mensaje que se enseña cuando falta la migración 0051. */
function faltaLaMigracion(mensaje: string): boolean {
  return (
    mensaje.includes("club_sponsor_documents") ||
    mensaje.includes("club-docs") ||
    mensaje.includes("does not exist") ||
    mensaje.includes("Bucket not found")
  );
}

/**
 * Subir el contrato o la factura de un patrocinador.
 *
 * EL ORDEN IMPORTA: primero el archivo al almacén y después la fila. Al
 * revés, un fallo al subir dejaría una fila apuntando a un archivo que
 * no existe, y la pantalla enseñaría un documento que al pulsarlo da
 * error. Así, si falla la fila, lo que queda es un archivo huérfano que
 * nadie ve; y aun así se borra a mano aquí abajo.
 */
export async function subirDocumento(
  _estado: EstadoDocumento,
  formData: FormData,
): Promise<EstadoDocumento> {
  const sesion = await clubDeLaSesion();
  if (sesion.error !== undefined) return { error: sesion.error };
  const { supabase, user } = sesion;

  const patrocinadorId = String(formData.get("patrocinadorId") ?? "");
  if (!patrocinadorId) return { error: "No sabemos de qué patrocinador se trata." };

  const tipo = String(formData.get("tipo") ?? "");
  if (!esTipoValido(tipo)) return { error: "Elige si es un contrato, una factura u otro documento." };

  // Que el patrocinador sea de este club. Sin esto, el id del
  // formulario bastaría para colgarle un archivo a la ficha de otro.
  const { data: patrocinador } = await supabase
    .from("club_sponsors")
    .select("id")
    .eq("id", patrocinadorId)
    .eq("club_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!patrocinador) return { error: "Ese patrocinador no es de tu club." };

  const archivo = formData.get("archivo");
  const esArchivo = archivo instanceof File && archivo.size > 0;

  const yaGuardados = await contarDocumentosDelPatrocinador(supabase, user.id, patrocinadorId);
  const problema = problemaAlSubir({
    tipoMime: esArchivo ? archivo.type : undefined,
    tamano: esArchivo ? archivo.size : undefined,
    yaGuardados,
  });
  if (problema) return { error: mensajeDelProblema(problema) };
  if (!esArchivo) return { error: "Elige un archivo antes de guardar." };

  const ruta = rutaDelDocumento(user.id, patrocinadorId, archivo.type, crypto.randomUUID());

  const { error: errorAlSubir } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (errorAlSubir) {
    avisarDeFallo("tareas", "No se pudo subir el documento del patrocinio", {
      error: errorAlSubir,
      patrocinadorId,
    });
    return {
      error: faltaLaMigracion(errorAlSubir.message ?? "")
        ? "Esta función necesita una actualización de la base de datos que todavía no está aplicada."
        : "No hemos podido subir el archivo. Inténtalo otra vez.",
    };
  }

  const { error: errorAlGuardar } = await supabase.from("club_sponsor_documents").insert({
    club_id: user.id,
    sponsor_id: patrocinadorId,
    kind: tipo,
    storage_path: ruta,
    file_name: nombreLimpio(archivo.name),
    mime_type: archivo.type,
    size_bytes: archivo.size,
  });

  if (errorAlGuardar) {
    // El archivo ya está arriba y la fila no: se deshace, porque si no
    // ese archivo se queda ocupando sitio para siempre sin que ninguna
    // pantalla pueda llegar a él.
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove([ruta]);

    avisarDeFallo("tareas", "No se pudo guardar el documento del patrocinio", {
      error: errorAlGuardar,
      patrocinadorId,
    });
    return {
      error: faltaLaMigracion(errorAlGuardar.message ?? "")
        ? "Esta función necesita una actualización de la base de datos que todavía no está aplicada."
        : "No hemos podido guardar el documento. Inténtalo otra vez.",
    };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Borrar un documento: primero la fila, después el archivo.
 *
 * Al revés que al subir, y por el mismo motivo de fondo: lo que no
 * puede quedar nunca es una fila sin archivo, porque eso es lo que el
 * club ve. Si se borra la fila y falla el archivo, queda un archivo
 * huérfano que no se ve y que la baja de la cuenta barre igual.
 */
export async function borrarDocumento(formData: FormData): Promise<void> {
  const sesion = await clubDeLaSesion();
  if (sesion.error !== undefined) return;
  const { supabase, user } = sesion;

  const documentoId = String(formData.get("documentoId") ?? "");
  if (!documentoId) return;

  const { data: documento } = await supabase
    .from("club_sponsor_documents")
    .select("storage_path")
    .eq("id", documentoId)
    .eq("club_id", user.id)
    .maybeSingle<{ storage_path: string }>();

  if (!documento) return;

  const { error } = await supabase
    .from("club_sponsor_documents")
    .delete()
    .eq("id", documentoId)
    .eq("club_id", user.id);

  if (error) {
    avisarDeFallo("tareas", "No se pudo borrar el documento del patrocinio", { error, documentoId });
    return;
  }

  await supabase.storage.from(BUCKET_DOCUMENTOS).remove([documento.storage_path]);
  revalidatePath(RUTA);
}
