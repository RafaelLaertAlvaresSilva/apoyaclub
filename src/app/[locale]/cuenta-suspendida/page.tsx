import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";

export const metadata: Metadata = {
  title: "Cuenta suspendida | ApoyaClub",
};

/**
 * A dónde va un club con `admin_suspended = true` al intentar entrar a
 * `/panel` (Fase 12, comprobación en middleware.ts). No se cierra su
 * sesión: solo se le aparta del panel hasta que un admin lo reactive.
 */
export default function CuentaSuspendidaPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Tu cuenta está suspendida</h1>
        <p className="text-sm text-zinc-600">
          El acceso al panel de tu club está temporalmente suspendido. Si crees que se trata de
          un error, escríbenos y lo revisamos.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Volver al inicio
          </Link>
          <CerrarSesionBoton />
        </div>
      </div>
    </div>
  );
}
