import { useTranslations } from "next-intl";
import {
  convieneEscribirle,
  diasSinEntrar,
  pasoHecho,
  PASOS_DEL_CLUB,
  siguientePaso,
  type AvanceClub,
} from "@/lib/avance-club";

/**
 * Los primeros pasos del club, con ✓ o ○, el último acceso y lo que
 * hay que decirle si se ha atascado (`lib/avance-club.ts`).
 */
export function AvanceDelClub({ avance }: { avance: AvanceClub }) {
  const t = useTranslations("admin.clubes.avance");
  const siguiente = siguientePaso(avance);
  const dias = diasSinEntrar(avance.ultimoAcceso);
  const escribirle = convieneEscribirle(avance);

  const detalle = (paso: (typeof PASOS_DEL_CLUB)[number]) => {
    if (paso === "ficha") return ` ${avance.ficha}%`;
    if (paso === "oportunidades" && avance.oportunidades > 0) {
      return ` ${avance.oportunidades}${avance.generadas > 0 ? ` (${t("generadas", { n: avance.generadas })})` : ""}`;
    }
    if (paso === "dossier" && avance.enlaceDossier) return ` · ${t("enlaceActivo")}`;
    return "";
  };

  return (
    <div className="min-w-40 space-y-0.5">
      {PASOS_DEL_CLUB.map((paso) => {
        const hecho = pasoHecho(avance, paso);
        return (
          <p key={paso} className={hecho ? "text-teal-700" : "text-zinc-400"}>
            <span aria-hidden="true">{hecho ? "✓" : "○"}</span> {t(`pasos.${paso}`)}
            <span className="tabular-nums">{detalle(paso)}</span>
          </p>
        );
      })}
      <p className={`pt-1 ${dias === null || dias >= 7 ? "font-medium text-amber-700" : "text-zinc-500"}`}>
        {dias === null ? t("nuncaHaEntrado") : dias === 0 ? t("entroHoy") : t("ultimoAcceso", { dias })}
      </p>
      {siguiente && (
        <p className={`rounded px-1.5 py-0.5 ${escribirle ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-700"}`}>
          {t(`siguiente.${siguiente}`)}
        </p>
      )}
    </div>
  );
}
