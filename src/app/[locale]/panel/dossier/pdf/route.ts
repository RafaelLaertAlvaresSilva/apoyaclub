import { NextResponse } from "next/server";
import { textosDeDocumento } from "@/lib/textos-documento";
import { reunirDatosDelDossier } from "@/lib/dossier-datos";
import { generarDossierPdf } from "@/lib/dossier-pdf";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

type ParametrosRuta = { params: Promise<{ locale: string }> };

/**
 * Descarga autenticada del dossier en PDF (Fase 9): el propio club,
 * desde su panel, genera y descarga el PDF con la selección de secciones
 * y oportunidades que tenga marcada en ese momento en el formulario (no
 * hace falta haberla guardado antes). El PDF se genera aquí mismo, en el
 * servidor, y no se guarda en ningún sitio.
 *
 * La versión editable en Word está al lado, en `../word`.
 */
export async function POST(request: Request, { params }: ParametrosRuta) {
  const { locale } = await params;
  const { t } = await textosDeDocumento(locale, "dossier");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return NextResponse.json({ error: t("noAutorizado") }, { status: 401 });
  }

  const datos = await reunirDatosDelDossier(
    supabase,
    user.id,
    await request.formData(),
    user.email ?? null,
  );

  if (!datos) {
    return NextResponse.json({ error: t("completaIdentidad") }, { status: 400 });
  }

  const pdf = await generarDossierPdf(datos, locale);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-${datos.slug}.pdf"`,
      "Content-Length": String(pdf.length),
    },
  });
}
