import { avisarDeFallo } from "@/lib/monitoring";
import { ETIQUETA_CATEGORIA_NECESIDAD } from "@/lib/opportunities";
import { enviarEmailNecesidadesQueEncajan } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { CategoriaNecesidad } from "@/lib/types";

type ClienteAdmin = ReturnType<typeof createAdminClient>;

/**
 * Avisar a la empresa de lo que le encaja (migración 0048).
 *
 * El problema que resuelve: una empresa publica lo que ofrece y no
 * vuelve. No porque no le interese, sino porque no tiene motivo para
 * volver a mirar — el club que necesitaba justo su servicio se apuntó
 * tres semanas después.
 *
 * Lo que le interesa no hay que preguntárselo: ya lo dijo al publicar.
 * Si ofrece fisioterapia, se le avisa de los clubes que buscan
 * fisioterapia.
 */

/** Cuántos días atrás se miran las necesidades nuevas. */
const DIAS_HACIA_ATRAS = 30;

/** Cuántas caben en un correo. Más que esto no se lee. */
export const MAXIMO_POR_CORREO = 5;

type FilaEmpresa = {
  id: string;
  name: string | null;
  province: string | null;
  unsubscribe_token: string;
};

type FilaOferta = { company_id: string; category: string | null };

type FilaNecesidad = {
  opportunity_id: string;
  title: string;
  need_category: string | null;
  club_name: string;
  club_slug: string;
  club_province: string | null;
  created_at: string;
};

export type NecesidadQueEncaja = {
  id: string;
  titulo: string;
  categoria: string;
  clubNombre: string;
  clubSlug: string;
  clubProvincia: string | null;
};

/**
 * Con qué se queda cada empresa de todo lo publicado.
 *
 * La provincia estrecha, no amplía: una empresa que ha dicho en qué
 * provincia está no quiere saber de un club a seiscientos kilómetros.
 * La que no lo ha dicho recibe de toda España, que es lo que significa
 * dejarlo en blanco.
 *
 * Se separa del envío para poder probarlo: es la regla de la que
 * depende que el correo sea útil o sea spam.
 */
export function loQueLeEncaja(
  empresa: { province: string | null },
  categoriasQueOfrece: Set<string>,
  necesidades: NecesidadQueEncaja[],
): NecesidadQueEncaja[] {
  return necesidades.filter((necesidad) => {
    if (!categoriasQueOfrece.has(necesidad.categoria)) return false;
    if (!empresa.province) return true;
    return necesidad.clubProvincia === empresa.province;
  });
}

/** Cómo se llama una categoría, para el correo. */
export function etiquetaDeCategoria(categoria: string): string {
  return ETIQUETA_CATEGORIA_NECESIDAD[categoria as CategoriaNecesidad] ?? categoria;
}

/**
 * Manda los avisos del día. Devuelve cuántos correos han salido.
 *
 * Un solo correo por empresa aunque le encajen cinco cosas: cinco
 * correos el mismo día es la forma más rápida de que alguien se dé de
 * baja de todo.
 */
export async function avisarDeNecesidadesQueEncajan(
  admin: ClienteAdmin,
  ahora = new Date(),
): Promise<number> {
  const desde = new Date(ahora.getTime() - DIAS_HACIA_ATRAS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: empresas, error: errorEmpresas }, { data: ofertas }, { data: necesidades }] =
    await Promise.all([
      admin
        .from("companies")
        .select("id, name, province, unsubscribe_token")
        .eq("alerts_enabled", true)
        .not("name", "is", null)
        .returns<FilaEmpresa[]>(),
      admin
        .from("company_offers")
        .select("company_id, category")
        .is("archived_at", null)
        .eq("status", "available")
        .returns<FilaOferta[]>(),
      admin
        .from("opportunity_search_view")
        .select("opportunity_id, title, need_category, club_name, club_slug, club_province, created_at")
        .eq("is_need", true)
        .gte("created_at", desde)
        .returns<FilaNecesidad[]>(),
    ]);

  if (errorEmpresas) {
    avisarDeFallo("empresa", "No se han podido leer las empresas para los avisos", errorEmpresas);
    return 0;
  }

  if (!empresas?.length || !necesidades?.length) return 0;

  // Qué ofrece cada una. Sin categoría no se puede cruzar con nada, así
  // que esa oferta no cuenta para los avisos.
  const categoriasPorEmpresa = new Map<string, Set<string>>();
  for (const oferta of ofertas ?? []) {
    if (!oferta.category) continue;
    const suyas = categoriasPorEmpresa.get(oferta.company_id) ?? new Set<string>();
    suyas.add(oferta.category);
    categoriasPorEmpresa.set(oferta.company_id, suyas);
  }

  const candidatas: NecesidadQueEncaja[] = necesidades
    .filter((fila) => !!fila.need_category)
    .map((fila) => ({
      id: fila.opportunity_id,
      titulo: fila.title,
      categoria: fila.need_category!,
      clubNombre: fila.club_name,
      clubSlug: fila.club_slug,
      clubProvincia: fila.club_province,
    }));

  let enviados = 0;

  for (const empresa of empresas) {
    const categorias = categoriasPorEmpresa.get(empresa.id);
    if (!categorias?.size) continue;

    const encajan = loQueLeEncaja(empresa, categorias, candidatas);
    if (encajan.length === 0) continue;

    // Lo que ya se le avisó no se repite. Se mira ahora y no al
    // principio para no traerse la tabla entera de una plataforma con
    // mil empresas.
    const { data: yaAvisadas } = await admin
      .from("company_alerts_sent")
      .select("opportunity_id")
      .eq("company_id", empresa.id)
      .in(
        "opportunity_id",
        encajan.map((necesidad) => necesidad.id),
      )
      .returns<{ opportunity_id: string }[]>();

    const vistas = new Set((yaAvisadas ?? []).map((fila) => fila.opportunity_id));
    const nuevas = encajan.filter((necesidad) => !vistas.has(necesidad.id));
    if (nuevas.length === 0) continue;

    const { data: usuario } = await admin.auth.admin.getUserById(empresa.id);
    const email = usuario.user?.email;
    if (!email) continue;

    const aEnsenar = nuevas.slice(0, MAXIMO_POR_CORREO);
    const locale = routing.defaultLocale;

    const resultado = await enviarEmailNecesidadesQueEncajan({
      empresaEmail: email,
      empresaNombre: empresa.name ?? "tu empresa",
      necesidades: aEnsenar.map((necesidad) => ({
        titulo: necesidad.titulo,
        categoria: etiquetaDeCategoria(necesidad.categoria),
        clubNombre: necesidad.clubNombre,
        clubUrl: `${SITE_URL}/${locale}/club/${necesidad.clubSlug}`,
      })),
      cuantasMas: nuevas.length - aEnsenar.length,
      buscarUrl: `${SITE_URL}/${locale}/buscar?busca=necesidades`,
      bajaUrl: `${SITE_URL}/${locale}/avisos/baja?t=${empresa.unsubscribe_token}`,
    });

    if (!resultado.ok) continue;

    // Se apunta SOLO lo que ha salido en el correo. Lo que no cupo se
    // queda sin marcar a propósito: mañana sale en el siguiente, con
    // lo cual la empresa acaba enterándose de todo, repartido en
    // varios días, en vez de perderse siete de doce para siempre.
    const { error } = await admin.from("company_alerts_sent").upsert(
      aEnsenar.map((necesidad) => ({
        company_id: empresa.id,
        opportunity_id: necesidad.id,
        sent_at: ahora.toISOString(),
      })),
      { ignoreDuplicates: true },
    );

    if (error) {
      avisarDeFallo("empresa", "No se ha podido apuntar el aviso enviado", error);
    }

    enviados += 1;
  }

  return enviados;
}
