import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ClubNoEncontrado() {
  const t = useTranslations("club.pagina");
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <p className="text-sm font-medium text-teal-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{t("noEncontradoTitulo")}</h1>
      <p className="mt-2 max-w-md text-zinc-600">
        {t("noEncontradoTexto")}
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accion px-6 py-3 font-medium text-sobre-color transition-colors hover:bg-accion-fuerte"
      >
        {t("volverAlInicio")}
      </Link>
    </div>
  );
}
