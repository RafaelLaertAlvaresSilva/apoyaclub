import * as Sentry from "@sentry/nextjs";

/**
 * Punto de entrada de instrumentación de Next.js: carga la configuración
 * de Sentry que corresponda al runtime en el que arranca el proceso.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Errores de render en servidor que Next.js captura antes de llegar a
 * `error.tsx`. Sin esto, el 500 que ve el club no dejaría rastro.
 */
export const onRequestError = Sentry.captureRequestError;
