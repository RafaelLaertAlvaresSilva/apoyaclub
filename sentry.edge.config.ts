import * as Sentry from "@sentry/nextjs";
import { DSN_SENTRY, OPCIONES_SENTRY } from "@/lib/sentry-opciones";

// El middleware (protección de rutas por rol) corre en el runtime edge y
// necesita su propia inicialización.
if (DSN_SENTRY) {
  Sentry.init(OPCIONES_SENTRY);
}
