import { useTranslations } from "next-intl";
import { BarraLogo } from "@/components/BarraLogo";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuenta eliminada | ApoyaClub",
};

/** Página de despedida tras eliminar la cuenta (Fase 11, club o empresa). */
export default function CuentaEliminadaPage() {
  const t = useTranslations("panel.avisos");
  return (
    <>
      <BarraLogo />
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("tuCuentaSeHa")}</h1>
          <p className="text-sm text-zinc-600">{t("hemosBorradoTuCuenta")}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-teal-700 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-800"
          >{t("volverAlInicio")}</Link>
        </div>
      </div>
    </>
  );
}
