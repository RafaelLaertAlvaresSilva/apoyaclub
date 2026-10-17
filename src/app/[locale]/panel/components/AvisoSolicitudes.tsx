import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Aviso, arriba del panel, de que hay empresas esperando respuesta.
 *
 * El contador del menú ya lo señala, pero esto es lo único que de verdad
 * mueve el negocio del club: una empresa que escribe y no recibe
 * respuesta en unos días se va con otro. Merece ocupar sitio y color
 * hasta que el club entre a leerla.
 */
export function AvisoSolicitudes({ sinAbrir }: { sinAbrir: number }) {
  const t = useTranslations("panel.avisos");
  if (sinAbrir === 0) return null;

  return (
    <section className="rounded-xl border-2 border-teal-600 bg-teal-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        {t("tienesEmpresasEsperando")}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-zinc-900">
        {t("empresasSinRespuesta", { n: sinAbrir })}
      </h2>
      <p className="mt-1 text-sm text-zinc-700">
        {t("responderProntoDiferenciaEntre")}
      </p>
      <Link
        href="/panel/solicitudes"
        className="mt-3 inline-flex items-center rounded-lg bg-accion px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-accion-fuerte"
      >
        {sinAbrir === 1 ? t("verSolicitud") : t("verSolicitudes")}
      </Link>
    </section>
  );
}
