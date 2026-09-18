import { NextResponse } from "next/server";
import { consumirLimite, ipDelVisitante } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Devuelve los datos de contacto de una empresa (migración 0047).
 *
 * Mismo criterio que `/api/contacto-club`: el correo y el teléfono no
 * se escriben nunca en el HTML de la página pública, porque de ahí los
 * recogen los robots que arman listas de spam. Se piden aquí, y así la
 * empresa no acaba recibiendo basura por haber querido ayudar a un
 * club de su barrio.
 *
 * No hace falta cuenta para verlo: poner un muro delante del contacto
 * es justo lo contrario de lo que la plataforma tiene que conseguir.
 */
export async function POST(request: Request) {
  let slug: string;

  try {
    const cuerpo = (await request.json()) as { slug?: unknown };
    slug = String(cuerpo.slug ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!slug || slug.length > 120) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  // Nadie abre treinta contactos en una hora mirando de verdad. Esto no
  // guarda un secreto —el dato acaba siendo público— pero evita que
  // alguien recorra el directorio entero recolectando correos.
  const dentroDelCupo = await consumirLimite({
    bucket: "ver-contacto-empresa",
    identificador: await ipDelVisitante(),
    limite: 30,
    ventanaSegundos: 3600,
  });

  if (!dentroDelCupo) {
    return NextResponse.json(
      { error: "Has abierto muchos contactos seguidos. Espera un rato." },
      { status: 429 },
    );
  }

  const { data: empresa } = await createAdminClient()
    .from("companies")
    .select("contact_name, contact_email, contact_phone, contact_public_consent, open_to_sponsor, website")
    .eq("slug", slug)
    .maybeSingle<{
      contact_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      contact_public_consent: boolean | null;
      open_to_sponsor: boolean | null;
      website: string | null;
    }>();

  // Mismas condiciones que la ficha pública: si la empresa no sale en
  // el directorio, su contacto tampoco.
  if (!empresa || !empresa.open_to_sponsor) {
    return NextResponse.json({ error: "Empresa no disponible." }, { status: 404 });
  }

  // Sin consentimiento no se enseña nada, ni aunque esté guardado.
  if (!empresa.contact_public_consent) {
    return NextResponse.json({ nombre: null, email: null, telefono: null, web: empresa.website });
  }

  return NextResponse.json({
    nombre: empresa.contact_name,
    email: empresa.contact_email,
    telefono: empresa.contact_phone,
    web: empresa.website,
  });
}
