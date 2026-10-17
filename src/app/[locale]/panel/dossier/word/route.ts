import { NextResponse } from "next/server";
import { textosDeDocumento } from "@/lib/textos-documento";
import { generarDossierWord } from "@/lib/dossier-docx";
import { reunirDatosDelDossier } from "@/lib/dossier-datos";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

type ParametrosRuta = { params: Promise<{ locale: string }> };

/**
 * El mismo dossier, en Word (.docx), para que el club lo pueda tocar.
 *
 * Mismo contenido y mismas secciones que el PDF; lo que cambia es que
 * este se abre en Word y se edita: cambiar una frase, meter una foto,
 * mover un apartado. Ver `dossier-docx.ts` para por qué la maqueta no
 * intenta imitar la del PDF.
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

  const word = await generarDossierWord(datos, locale);

  return new NextResponse(new Uint8Array(word), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="dossier-${datos.slug}.docx"`,
      "Content-Length": String(word.length),
    },
  });
}
