/**
 * Fase 10: estado de la suscripción de Stripe de un club, guardado como
 * columnas adicionales de la tabla `clubs` (no hay tabla propia: es un
 * espejo del estado de una única Subscription de Stripe por club).
 */

/** Espejo de `Subscription.status` de Stripe. Null = el club nunca ha
 * empezado ninguna suscripción. */
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | null;

/** Columnas de `clubs` relacionadas con la suscripción (tal y como las
 * devuelve Supabase). */
export type SubscriptionRow = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type ClubSubscription = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  /** Fin del periodo ya pagado (o del de prueba, si todavía no se ha
   * cobrado nada). Es la fecha de "próxima renovación", o la fecha en
   * la que se pierde el acceso si `cancelAtPeriodEnd` es true. */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function subscriptionRowToInfo(row: SubscriptionRow): ClubSubscription {
  return {
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

/** Un club solo aparece en su página pública y en el buscador mientras
 * su suscripción está en prueba o activa (Fase 10). Debe coincidir con
 * el filtro de las vistas `club_public_profiles` y
 * `opportunity_search_view` (migración 0007). */
export function esVisiblePublicamente(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}

/** Texto en español del estado, para mostrar en el panel. */
export function etiquetaEstadoSuscripcion(status: SubscriptionStatus): string {
  switch (status) {
    case "trialing":
      return "En periodo de prueba";
    case "active":
      return "Activa";
    case "past_due":
      return "Pago pendiente";
    case "unpaid":
      return "Impagada";
    case "canceled":
      return "Cancelada";
    case "incomplete":
    case "incomplete_expired":
      return "Pendiente de completar el pago";
    case "paused":
      return "Pausada";
    default:
      return "Sin suscripción";
  }
}
