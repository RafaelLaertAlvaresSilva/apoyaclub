import { NextResponse } from "next/server";
import { BUCKET_DOCUMENTOS, SEGUNDOS_DEL_ENLACE } from "@/lib/documentos-datos";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Abrir el contrato o la factura de un patrocinador.
 *
 * El almacén de estos papeles es privado (migración 0051): no hay
 * dirección pública que pegar en un `<a href>`. Esta ruta es la que
 * comprueba de quién es el archivo y, solo entonces, le pide al almacén
 * un enlace firmado que caduca en un minuto y manda al navegador allí.
 *
 * POR QUÉ UN REDIRECCIONAMIENTO Y NO DEVOLVER EL ARCHIVO. Devolverlo
 * obligaría a que los bytes pasaran por el servidor de la aplicación:
 * más lento, más caro y sin ninguna ventaja. Firmando el enlace, el
 * archivo sale directo del almacén.
 *
 * POR QUÉ UN MINUTO. Lo justo para que el navegador lo abra. Si alguien
 * copia la dirección firmada y la manda por ahí, deja de valer antes de
 * que llegue a ningún sitio.
 *
 * El `id` viaja como parámetro y NO el nombre del archivo: con la ruta
 * del almacén en la dirección, cambiar una letra sería intentar leer el
 * archivo de otro club. Con el id, lo que se comprueba es la fila, y
 * la fila lleva el club dentro.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Falta el documento." }, { status: 400 });

  // El `club_id` sale de la sesión y va en el `where`: un id de otro
  // club no devuelve nada, en vez de devolver su archivo.
  const { data: documento } = await supabase
    .from("club_sponsor_documents")
    .select("storage_path, file_name")
    .eq("id", id)
    .eq("club_id", user.id)
    .maybeSingle<{ storage_path: string; file_name: string }>();

  if (!documento) {
    return NextResponse.json({ error: "Ese documento no existe." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(documento.storage_path, SEGUNDOS_DEL_ENLACE, {
      download: documento.file_name,
    });

  if (error || !data) {
    avisarDeFallo("tareas", "No se pudo firmar el enlace del documento", { error, id });
    return NextResponse.json({ error: "No se ha podido abrir el documento." }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
