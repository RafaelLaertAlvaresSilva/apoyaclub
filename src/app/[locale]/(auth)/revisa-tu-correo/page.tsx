import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revisa tu correo",
};

export default function RevisaTuCorreoPage() {
  const t = useTranslations("auth.revisaCorreo");
  const tComun = useTranslations("auth.comun");

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("titulo")}</h1>
      <p className="text-sm text-zinc-500">
        {t("texto")}
      </p>
      <p className="text-xs text-zinc-500">
        {t("spam")}
      </p>
      <Link href="/login" className="inline-block text-sm font-medium text-teal-700 hover:underline">
        {tComun("volverALogin")}
      </Link>
    </div>
  );
}
