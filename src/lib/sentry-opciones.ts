/**
 * Opciones compartidas por las tres inicializaciones de Sentry
 * (navegador, servidor y edge), en un solo sitio para que no se
 * desincronicen.
 *
 * Sentry es opcional: sin `NEXT_PUBLIC_SENTRY_DSN` no se inicializa
 * nada y la aplicación funciona igual. Así el proyecto sigue
 * arrancando en local sin cuenta de Sentry.
 *
 * Privacidad: no se envían ni cuerpos de formulario ni datos del
 * usuario. Solo el error, la ruta y el identificador interno del
 * usuario cuando ya lo trae el contexto (`sendDefaultPii: false`).
 */
export const DSN_SENTRY = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const OPCIONES_SENTRY = {
  dsn: DSN_SENTRY,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // 10 % de las trazas de rendimiento: suficiente para ver tendencias
  // sin gastar la cuota del plan gratuito.
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  // Ruido que no aporta nada: extensiones del navegador y cancelaciones
  // por navegar a otra página antes de que termine una petición.
  ignoreErrors: [
    "ResizeObserver loop completed with undelivered notifications",
    "AbortError",
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],
  enabled: !!DSN_SENTRY,
};
