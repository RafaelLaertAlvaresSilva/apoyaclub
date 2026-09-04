import { NextResponse } from "next/server";
import { clubRowToProfile, type ClubRow } from "@/lib/club-mappers";
import { generarInformeWord } from "@/lib/informe-docx";
import { prepararInforme } from "@/lib/informe-patrocinio";
import { generarInformePdf } from "@/lib/informe-pdf";
import { createClient } from "@/lib/supabase/server";
import { obtenerTareasDelClub } from "@/lib/tareas-datos";
import type { Role } from "@/lib/types";

/**
 * Descarga del informe de patrocinio de una empresa, en PDF o en Word.
 *
 * Lo pide un formulario normal del panel, no JavaScript: el navegador
 * ya sabe descargar la respuesta de un POST con `Content-Disposition`, y
 * hacerlo a mano con fetch y un blob solo añade un sitio más donde
 * fallar.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const empresa = String(formData.get("empresa") ?? "").trim();
  const formato = String(formData.get("formato") ?? "pdf");

  if (!empresa || empresa.length > 120) {
    return NextResponse.json({ error: "Falta la empresa." }, { status: 400 });
  }

  const [{ data: filaClub }, tareas] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", user.id).maybeSingle<ClubRow>(),
    obtenerTareasDelClub(supabase, user.id),
  ]);

  if (!filaClub) {
    return NextResponse.json({ error: "Completa primero la identidad del club." }, { status: 400 });
  }

  const informe = prepararInforme(empresa, tareas);

  if (informe.total === 0) {
    return NextResponse.json(
      { error: "Todavía no hay acciones apuntadas para esa empresa." },
      { status: 400 },
    );
  }

  const datos = {
    perfil: clubRowToProfile(filaClub),
    informe,
    emailContacto: filaClub.contact_email ?? user.email ?? null,
  };

  // El nombre del archivo lleva el de la empresa, así que hay que
  // limpiarlo: una barra o unas comillas dentro de `filename` rompen la
  // cabecera y el navegador guarda el archivo con un nombre absurdo.
  const nombreLimpio = empresa
    .normalize("NFD")
    // Escrito con escapes y no con los caracteres tal cual: son
    // invisibles y no sobreviven bien a un copiar y pegar.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "empresa";

  if (formato === "word") {
    const word = await generarInformeWord(datos);
    return new NextResponse(new Uint8Array(word), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="informe-${nombreLimpio}.docx"`,
        "Content-Length": String(word.length),
      },
    });
  }

  const pdf = await generarInformePdf(datos);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-${nombreLimpio}.pdf"`,
      "Content-Length": String(pdf.length),
    },
  });
}
