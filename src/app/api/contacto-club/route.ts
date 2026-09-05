import { NextResponse } from "next/server";
import { avisarDeFallo } from "@/lib/monitoring";
import { consumirLimite, ipDelVisitante } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Devuelve los datos de contacto de un club y apunta que alguien los ha
 * mirado (migración 0022).
 *
 * Antes el correo del club salía escrito en el HTML de la página
 * pública, así que además de no poder contar nada, cualquier robot que
 * pasara por ahí se lo llevaba. Ahora hay que pedirlo, lo que resuelve
 * las dos cosas: el club deja de recibir spam y la plataforma sabe
 * cuántas empresas llegan hasta el final.
 *
 * No hay que estar registrado para verlo: poner un muro delante del
 * contacto reduciría los patrocinios, que es justo lo contrario de lo
 * que la plataforma tiene que conseguir. Solo se apunta quién es cuando
 * hay sesión de empresa.
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

  // Un visitante real no abre cien contactos por hora. Esto no protege
  // un secreto (el dato acaba siendo público), pero sí evita que alguien
  // recorra la plataforma entera recolectando correos de una sentada.
  const ip = await ipDelVisitante();
  const dentroDelCupo = await consumirLimite({
    bucket: "ver-contacto",
    identificador: ip,
    limite: 30,
    ventanaSegundos: 3600,
  });

  if (!dentroDelCupo) {
    return NextResponse.json(
      { error: "Has abierto muchos contactos seguidos. Espera un rato." },
      { status: 429 },
    );
  }

  const admin = createAdminClient();

  const { data: club } = await admin
    .from("clubs")
    .select("id, contact_name, contact_phone, contact_email, contact_hours, contact_public_consent, subscription_status, admin_suspended")
    .eq("slug", slug)
    .maybeSingle<{
      id: string;
      contact_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      contact_hours: string | null;
      contact_public_consent: boolean | null;
      subscription_status: string | null;
      admin_suspended: boolean | null;
    }>();

  // Mismas condiciones de visibilidad que la ficha pública: si el club
  // no está publicado, su contacto tampoco.
  const publicado =
    !!club &&
    !club.admin_suspended &&
    (club.subscription_status === "trialing" || club.subscription_status === "active");

  if (!publicado) {
    return NextResponse.json({ error: "Club no disponible." }, { status: 404 });
  }

  // El correo que el club ha decidido publicar manda sobre el de su
  // cuenta (migración 0024). Solo se consulta la cuenta si no hay uno.
  let email = club.contact_email;
  if (!email) {
    const { data: usuario } = await admin.auth.admin.getUserById(club.id);
    email = usuario.user?.email ?? null;
  }

  // La métrica nunca puede impedir que se vea el contacto, pero sí tiene
  // que dejar rastro si falla: es la señal más valiosa que produce la
  // plataforma y perderla en silencio deja al club creyendo que nadie le
  // ha mirado.
  try {
    const { error } = await admin
      .from("club_contact_views")
      .insert({ club_id: club.id });

    if (error) avisarDeFallo("metricas", "No se ha podido apuntar la apertura de contacto", error);
  } catch (excepcion) {
    avisarDeFallo("metricas", "Fallo apuntando la apertura de contacto", excepcion);
  }

  return NextResponse.json({
    email,
    // El nombre y el teléfono solo si el club autorizó publicarlos.
    nombre: club.contact_public_consent ? club.contact_name : null,
    telefono: club.contact_public_consent ? club.contact_phone : null,
    horario: club.contact_hours,
  });
}
