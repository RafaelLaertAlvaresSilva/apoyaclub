import * as Sentry from "@sentry/nextjs";

/**
 * Aviso de un fallo que nadie va a ver por su cuenta (Fase 15).
 *
 * Los sitios críticos de la aplicación —el webhook de Stripe y los
 * crons— corren sin nadie delante: hasta ahora sus errores se escribían
 * con `console.error` y morían en los logs de Vercel. Un cobro que no
 * sincroniza deja a un club pagando con la página apagada, o al revés.
 *
 * Sigue escribiendo en consola (útil en local) y además manda el error a
 * Sentry con la etiqueta de la zona, para poder avisar por email desde
 * allí. Sin DSN configurado, Sentry no hace nada.
 */
export function avisarDeFallo(
  zona: "stripe-webhook" | "cron-suscripciones" | "email" | "dossier" | "metricas" | "tareas" | "publico" | "sesion" | "prospectos" | "auth",
  mensaje: string,
  detalle?: unknown,
): void {
  console.error(`[${zona}] ${mensaje}`, detalle ?? "");

  Sentry.withScope((scope) => {
    scope.setTag("zona", zona);
    scope.setLevel("error");
    if (detalle !== undefined) scope.setExtra("detalle", detalle);

    if (detalle instanceof Error) {
      Sentry.captureException(detalle);
    } else {
      Sentry.captureMessage(`[${zona}] ${mensaje}`);
    }
  });
}
