import { porcentajeDePlazas } from "@/lib/opportunities";

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
  const total = slotsTotal ?? 0;
  if (total < 2) return null;

  const cubiertas = Math.min(Math.max(slotsTaken, 0), total);
  const porcentaje = porcentajeDePlazas({ slotsTotal, slotsTaken });
  const completa = cubiertas >= total;

  const oscuro = tono === "oscuro";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`text-xs font-medium ${oscuro ? "text-white/70" : "text-zinc-600"}`}>
          {cubiertas} de {total} {etiqueta}
        </span>
        <span
          className={`text-xs font-semibold ${
            completa
              ? oscuro
                ? "text-white"
                : "text-teal-700"
              : oscuro
                ? "text-white/70"
                : "text-zinc-500"
          }`}
        >
          {completa ? "Completa" : `${porcentaje}%`}
        </span>
      </div>
      <div
        className={`h-2 w-full overflow-hidden rounded-full ${oscuro ? "bg-white/15" : "bg-zinc-100"}`}
        role="progressbar"
        aria-valuenow={cubiertas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${cubiertas} de ${total} ${etiqueta}`}
      >
        <div
          className={`h-full rounded-full transition-[width] ${
            completa ? "bg-teal-600" : "bg-teal-500"
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
