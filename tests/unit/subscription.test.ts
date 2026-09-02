import { describe, expect, it } from "vitest";
import {
  esVisiblePublicamente,
  etiquetaEstadoSuscripcion,
  subscriptionRowToInfo,
  type SubscriptionStatus,
} from "@/lib/subscription-mappers";

describe("estado de la suscripción", () => {
  it("solo es visible en público con la prueba o la suscripción en marcha", () => {
    expect(esVisiblePublicamente("trialing")).toBe(true);
    expect(esVisiblePublicamente("active")).toBe(true);

    const invisibles: SubscriptionStatus[] = [
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
      null,
    ];
    for (const estado of invisibles) {
      expect(esVisiblePublicamente(estado)).toBe(false);
    }
  });

  it("traduce las columnas de Supabase al objeto que usa el panel", () => {
    expect(
      subscriptionRowToInfo({
        stripe_customer_id: "cus_1",
        stripe_subscription_id: "sub_1",
        subscription_status: "active",
        trial_ends_at: null,
        current_period_end: "2026-10-01T00:00:00.000Z",
        cancel_at_period_end: true,
      }),
    ).toEqual({
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      cancelAtPeriodEnd: true,
    });
  });

  it("cada estado tiene texto en español, sin tecnicismos de Stripe", () => {
    const estados: SubscriptionStatus[] = [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
      null,
    ];

    for (const estado of estados) {
      const etiqueta = etiquetaEstadoSuscripcion(estado);
      expect(etiqueta.length).toBeGreaterThan(0);
      expect(etiqueta).not.toMatch(/trialing|past_due|incomplete/);
    }
  });
});
