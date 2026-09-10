import type { SubscriptionStatus } from "@/lib/subscription-mappers";

/** Una fila del listado de clubes del admin (Fase 12): ya traducida a camelCase y con el % de perfil ya calculado. */
export type ClubAdminRow = {
  id: string;
  name: string;
  city: string;
  email: string | null;
  createdAt: string;
  subscriptionStatus: SubscriptionStatus;
  /** Fin de la prueba gratuita, que es también el fin del acceso regalado. */
  trialEndsAt: string | null;
  /** Si tiene suscripción de Stripe, el acceso ya no se regala desde aquí. */
  tieneSuscripcionEnStripe: boolean;
  profileCompletion: number;
  verified: boolean;
  suspended: boolean;
  /** Actividad de los últimos 90 días (migración 0022). */
  visitas: number;
  empresas: number;
  contactos: number;
};
