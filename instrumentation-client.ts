import * as Sentry from "@sentry/nextjs";
import { DSN_SENTRY, OPCIONES_SENTRY } from "@/lib/sentry-opciones";

// Errores del navegador. Se carga solo en el cliente; sin DSN no hace
// nada (ver `src/lib/sentry-opciones.ts`).
if (DSN_SENTRY) {
  Sentry.init({
    ...OPCIONES_SENTRY,
    // Sin repetición de sesión: graba la pantalla del usuario y aquí no
    // compensa ni por privacidad ni por cuota.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
