import { useTranslations } from "next-intl";
import { BarraLogo } from "@/components/BarraLogo";
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
  const t = useTranslations("panel.avisos");
  return (
    <>
      <BarraLogo />
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("tuCuentaEstaSuspendida")}</h1>
          <p className="text-sm text-zinc-600">{t("elAccesoAlPanel")}</p>
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-block rounded-lg bg-teal-700 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-800"
            >{t("volverAlInicio")}</Link>
            <CerrarSesionBoton />
          </div>
        </div>
      </div>
    </>
  );
}
