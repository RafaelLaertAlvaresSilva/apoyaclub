import {
  accionesPorResponsable,
  condicionesEnTexto,
  type Accion,
  type Beneficio,
  type CondicionesDeLaFicha,
} from "@/lib/ficha-oportunidad";

/**
 * La ficha de una oportunidad, como la lee una empresa.
 *
 * Tres preguntas separadas, que es justo lo que antes iba todo junto en
 * un párrafo: qué recibo, quién hace cada cosa, y bajo qué
 * condiciones. La tercera es la que evita la discusión de marzo.
 *
 * Los apartados vacíos no se pintan. Una oportunidad sin ficha
 * rellenada se sigue viendo entera con su descripción de siempre: esto
 * suma cuando está, y no deja un hueco cuando falta.
 */
export function FichaDeOportunidad({
  beneficios,
  acciones,
  condiciones,
}: {
  beneficios: Beneficio[];
  acciones: Accion[];
  condiciones: CondicionesDeLaFicha;
}) {
  const grupos = accionesPorResponsable(acciones);
  const lineasDeCondiciones = condicionesEnTexto(condiciones);

  if (beneficios.length === 0 && grupos.length === 0 && lineasDeCondiciones.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {beneficios.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brand-teal-dark">
            La empresa recibe
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {beneficios.map((beneficio, indice) => (
              <li key={`${beneficio.texto}-${indice}`} className="flex items-start gap-2.5 text-zinc-800">
                <span aria-hidden="true" className="mt-0.5 text-brand-teal-dark">✓</span>
                <span>
                  {beneficio.cantidad && (
                    <span className="font-semibold">{beneficio.cantidad}&nbsp;×&nbsp;</span>
                  )}
                  {beneficio.texto}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {grupos.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Quién hace qué</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {grupos.map((grupo) => (
              <div
                key={grupo.responsable}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-zinc-900">{grupo.titulo}</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {grupo.lineas.map((accion, indice) => (
                    <li key={`${accion.texto}-${indice}`} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span aria-hidden="true" className="mt-1 text-xs text-zinc-400">•</span>
                      <span>{accion.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {lineasDeCondiciones.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Condiciones</h3>
          <dl className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {lineasDeCondiciones.map((linea) => (
              <div key={linea.que} className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-3">
                <dt className="w-32 shrink-0 text-sm font-medium text-zinc-500">{linea.que}</dt>
                <dd className="min-w-0 flex-1 text-sm text-zinc-800">{linea.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
