import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * La franja de arriba de la vista previa: que el club sepa que esto lo
 * ve él y por qué no lo ve nadie más, y cómo volver a su panel.
 *
 * `urlPublica` solo cuando lo que está mirando sí se ve en público:
 * entonces el enlace de verdad es ese, el que puede compartir.
 */
export async function AvisoVistaPrevia({
  motivo,
  urlPublica,
}: {
  motivo: "paginaOculta" | "oportunidadNoDisponible" | null;
  urlPublica: string | null;
}) {
  const t = await getTranslations("club.vistaPrevia");

  return (
    <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p>
          <span className="font-semibold">{t("titulo")}</span>{" "}
          {motivo ? t(motivo) : t("yaPublica")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {urlPublica && (
            <a
              href={urlPublica}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              {t("abrirPublica")} <span aria-hidden="true">↗</span>
            </a>
          )}
          <Link
            href="/panel"
            className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
          >
            {t("volverAlPanel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
