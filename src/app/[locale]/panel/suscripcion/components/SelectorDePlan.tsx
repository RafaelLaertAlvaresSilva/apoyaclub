import { BotonEnviar } from "@/components/BotonEnviar";
import { PLANES_EN_ORDEN, periodicidad, precioFormateado } from "@/lib/planes";
import { iniciarSuscripcion } from "../actions";

/**
 * Los tres planes, uno al lado del otro (migración 0021).
 *
 * El orden no es por precio sino por lo que interesa que elija el club:
 * fundador primero mientras queden plazas (porque tiene fecha de
 * caducidad y eso es lo que hace decidir hoy), temporada destacado, y el
 * mensual al final como referencia cara que hace que los otros dos
 * parezcan lo que son.
 */
export function SelectorDePlan({
  plazasFundadorLibres,
  textoBoton,
}: {
  plazasFundadorLibres: number;
  textoBoton: string;
}) {
  const planes = PLANES_EN_ORDEN.filter(
    (plan) => !plan.limitado || plazasFundadorLibres > 0,
  );

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {planes.map((plan) => (
          <form
            key={plan.id}
            action={iniciarSuscripcion}
            className={`flex flex-col rounded-xl border bg-white p-5 ${
              plan.destacado ? "border-2 border-teal-600" : "border-zinc-200"
            }`}
          >
            <input type="hidden" name="plan" value={plan.id} />

            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">{plan.nombre}</h3>
              {plan.destacado && (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  Recomendado
                </span>
              )}
              {plan.limitado && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Quedan {plazasFundadorLibres}
                </span>
              )}
            </div>

            <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-900">
              {precioFormateado(plan)}
            </p>
            <p className="text-sm text-zinc-500">{periodicidad(plan)}, IVA incluido</p>

            <p className="mt-3 text-sm font-medium text-zinc-700">{plan.reclamo}</p>
            <p className="mt-1 flex-1 text-sm text-zinc-500">{plan.detalle}</p>

            <div className="mt-5">
              <BotonEnviar>{textoBoton}</BotonEnviar>
            </div>
          </form>
        ))}
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        Empiezas con <strong className="font-medium text-zinc-700">30 días gratis</strong> y no se
        cobra nada hasta que terminen. Si un solo patrocinador te deja 300 €, ya has cubierto el año
        entero.
      </p>
    </div>
  );
}
