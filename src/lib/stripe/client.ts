import Stripe from "stripe";

/**
 * Cliente de Stripe (Fase 10), solo para código de servidor (Server
 * Actions, Route Handlers): nunca se importa desde un Client Component.
 *
 * Usa siempre `STRIPE_SECRET_KEY` (ver `.env.local.example`): en modo
 * test empieza por `sk_test_`, en producción por `sk_live_`. La clave
 * nunca se escribe en el código, solo se lee de la variable de entorno.
 */
let cliente: Stripe | null = null;

export function obtenerStripe(): Stripe {
  if (cliente) return cliente;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Falta STRIPE_SECRET_KEY: configura tus claves de Stripe en .env.local (ver .env.local.example).",
    );
  }

  cliente = new Stripe(secretKey);
  return cliente;
}
