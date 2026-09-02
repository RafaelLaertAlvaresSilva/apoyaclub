import * as Sentry from "@sentry/nextjs";
import { DSN_SENTRY, OPCIONES_SENTRY } from "@/lib/sentry-opciones";

// Errores del servidor: Server Actions, Route Handlers y render en
// servidor. Ver `src/lib/sentry-opciones.ts`.
if (DSN_SENTRY) {
  Sentry.init(OPCIONES_SENTRY);
}
