import { useTranslations } from "next-intl";
import { BarraLogo } from "@/components/BarraLogo";
import { Link } from "@/i18n/navigation";

export default function AuthErrorPage() {
  const t = useTranslations("panel.avisos");
  return (
    <>
      <BarraLogo />
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">{t("elEnlaceNoEs")}</h1>
          <p className="text-sm text-zinc-500">{t("elEnlaceHaCaducado")}</p>
          <Link href="/login" className="inline-block text-sm font-medium text-teal-700 hover:underline">{t("irAIniciarSesion")}</Link>
        </div>
      </div>
    </>
  );
}
