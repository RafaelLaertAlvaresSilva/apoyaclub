import { useTranslations } from "next-intl";
import { porcentajeDePlazas } from "@/lib/opportunities";

/** Las palabras que tienen traducción. Cualquier otra se enseña tal cual. */
const UNIDADES_CONOCIDAS = ["plazas", "colaboradores", "patrocinadores", "empresas"];

/**
 * Cuántas plazas de una oportunidad están cubiertas, con su barra.
 *
 * Existe porque un "2 de 10" suelto no dice gran cosa y una barra al
 * 20 % sí: se ve de un golpe que queda sitio, que es exactamente lo que
 * tiene que pensar la empresa que la está mirando. Y para el club es el
 * recordatorio de que le faltan ocho.
 *
 * El porcentaje se calcula al pintarlo, nunca se guarda: en cuanto el
 * club marca una plaza más, o corrige el total, la barra ya está bien
 * sin que nadie tenga que recalcular nada.
 */
export function BarraDePlazas({
  slotsTotal,
  slotsTaken,
  etiqueta = "plazas",
  tono = "claro",
}: {
  slotsTotal: number | null;
  slotsTaken: number;
  /** Cómo se llaman las plazas aquí: "plazas", "colaboradores"… */
  etiqueta?: string;
  /** "oscuro" para fondos de color, donde el gris no se lee. */
  tono?: "claro" | "oscuro";
}) {
  const t = useTranslations("common.plazas");
  const total = slotsTotal ?? 0;
  if (total < 2) return null;

  const unidad = UNIDADES_CONOCIDAS.includes(etiqueta) ? t(`unidades.${etiqueta}`) : etiqueta;
  const progreso = t("progreso", { cubiertas: Math.min(Math.max(slotsTaken, 0), total), total, unidad });

  const cubiertas = Math.min(Math.max(slotsTaken, 0), total);
  const porcentaje = porcentajeDePlazas({ slotsTotal, slotsTaken });
  const completa = cubiertas >= total;

  const oscuro = tono === "oscuro";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`text-xs font-medium ${oscuro ? "text-sobre-color/70" : "text-zinc-600"}`}>
          {progreso}
        </span>
        <span
          className={`text-xs font-semibold ${
            completa
              ? oscuro
                ? "text-sobre-color"
                : "text-teal-700"
              : oscuro
                ? "text-sobre-color/70"
                : "text-zinc-500"
          }`}
        >
          {completa ? t("completa") : `${porcentaje}%`}
        </span>
      </div>
      <div
        className={`h-2 w-full overflow-hidden rounded-full ${oscuro ? "bg-white/15" : "bg-zinc-100"}`}
        role="progressbar"
        aria-valuenow={cubiertas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={progreso}
      >
        <div
          className={`h-full rounded-full transition-[width] ${
            completa ? "bg-medidor" : "bg-teal-500"
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
