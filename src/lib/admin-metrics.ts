import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/**
 * Métricas del panel de administración (Fase 12). Con pocos clubes en
 * la plataforma no compensa complicar esto con vistas materializadas
 * ni tablas de agregados: se cuenta todo al vuelo, con el cliente de
 * servicio (createAdminClient), que puede leer todas las filas sin
 * pasar por la RLS de cada club/empresa.
 */
export type MetricasAdmin = {
  clubes: {
    /** Todas las cuentas con rol "club" (Supabase Auth), no solo las que ya tienen fila en `clubs` (ver `obtenerUsuariosPorRol`). */
    total: number;
    /** subscription_status = 'trialing': en el mes gratis. */
    enPrueba: number;
    /** subscription_status = 'active': pagando. */
    activos: number;
    /** subscription_status = 'past_due' o 'unpaid'. */
    pagoPendiente: number;
    cancelados: number;
    /** Registrados pero sin `subscription_status`: ni han creado la fila de perfil ni han iniciado nunca la suscripción. */
    sinEmpezar: number;
    suspendidos: number;
    verificados: number;
  };
  /** Todas las cuentas con rol "empresa" (Supabase Auth), no solo las que ya tienen fila en `companies`. */
  empresas: { total: number };
  /** Oportunidades no archivadas (`archived_at is null`), sea cual sea su estado. */
  oportunidadesPublicadas: number;
  solicitudesContacto: number;
  busquedasRealizadas: number;
  conversion: {
    /** Clubes que alguna vez llegaron a iniciar el pago en Stripe (tienen `stripe_subscription_id`). */
    empezaronPrueba: number;
    /** De esos, cuántos han llegado a tener un ciclo de facturación real. */
    convirtieron: number;
    /** Redondeado a entero; null si nadie ha empezado todavía una prueba. */
    porcentaje: number | null;
  };
};

type ClubMetricaRow = {
  subscription_status: SubscriptionStatus;
  admin_suspended: boolean | null;
  verified: boolean | null;
  stripe_subscription_id: string | null;
};

/**
 * Estados que implican que el club ha llegado a tener, en algún
 * momento, un ciclo de facturación real (no solo el mes de prueba):
 * además de "active", cuentan "past_due"/"unpaid" (cobro fallido tras
 * la prueba) y "canceled" (canceló después de haber llegado a pagar,
 * o durante la prueba también acaba en "canceled" — sin un histórico
 * de eventos no se puede distinguir con exactitud uno de otro; es una
 * aproximación razonable mientras la plataforma tenga pocos clubes).
 */
const ESTADOS_CONVERTIDOS: SubscriptionStatus[] = ["active", "past_due", "unpaid", "canceled"];

export async function obtenerMetricasAdmin(): Promise<MetricasAdmin> {
  const admin = createAdminClient();

  const [
    totalClubesRegistrados,
    totalEmpresasRegistradas,
    { data: filasClubes },
    { count: oportunidadesPublicadas },
    { count: solicitudesContacto },
    { count: busquedasRealizadas },
  ] = await Promise.all([
    obtenerUsuariosPorRol("club").then((usuarios) => usuarios.length),
    obtenerUsuariosPorRol("empresa").then((usuarios) => usuarios.length),
    admin
      .from("clubs")
      .select("subscription_status, admin_suspended, verified, stripe_subscription_id")
      .returns<ClubMetricaRow[]>(),
    admin.from("opportunities").select("*", { count: "exact", head: true }).is("archived_at", null),
    admin.from("contact_requests").select("*", { count: "exact", head: true }),
    admin.from("search_logs").select("*", { count: "exact", head: true }),
  ]);

  const clubes = filasClubes ?? [];
  const contar = (predicado: (fila: ClubMetricaRow) => boolean) => clubes.filter(predicado).length;

  const empezaronPrueba = contar((fila) => !!fila.stripe_subscription_id);
  const convirtieron = contar(
    (fila) => !!fila.stripe_subscription_id && ESTADOS_CONVERTIDOS.includes(fila.subscription_status),
  );
  const enPrueba = contar((fila) => fila.subscription_status === "trialing");
  const activos = contar((fila) => fila.subscription_status === "active");
  const pagoPendiente = contar((fila) => fila.subscription_status === "past_due" || fila.subscription_status === "unpaid");
  const cancelados = contar((fila) => fila.subscription_status === "canceled");

  return {
    clubes: {
      total: totalClubesRegistrados,
      enPrueba,
      activos,
      pagoPendiente,
      cancelados,
      // Registrados que no encajan en ninguno de los estados de arriba:
      // incluye tanto los que aún no han creado su fila de perfil (ni
      // siquiera han abierto el panel) como los que sí la tienen pero
      // con subscription_status a null (no han llegado a Suscripción).
      sinEmpezar: Math.max(0, totalClubesRegistrados - enPrueba - activos - pagoPendiente - cancelados),
      suspendidos: contar((fila) => !!fila.admin_suspended),
      verificados: contar((fila) => !!fila.verified),
    },
    empresas: { total: totalEmpresasRegistradas },
    oportunidadesPublicadas: oportunidadesPublicadas ?? 0,
    solicitudesContacto: solicitudesContacto ?? 0,
    busquedasRealizadas: busquedasRealizadas ?? 0,
    conversion: {
      empezaronPrueba,
      convirtieron,
      porcentaje: empezaronPrueba > 0 ? Math.round((convirtieron / empezaronPrueba) * 100) : null,
    },
  };
}
