import { useTranslations } from "next-intl";

/**
 * Banner que encabeza cada página legal (Fase 11): estas páginas son
 * plantillas de partida, no textos definitivos. No deben publicarse ni
 * enlazarse de forma visible hasta que un abogado las revise y las
 * adapte a APOYACLUB. Ver `src/lib/legal.ts` para la fecha de versión.
 */
export function AvisoRevisionJuridica() {
  const t = useTranslations("common.componentes");
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-semibold">{t("plantillaPendienteDeRevision")}</p>
      <p className="mt-1">{t("esteTextoEsUn")}</p>
    </div>
  );
}
